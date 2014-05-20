(function($, win, doc) {
    function popup(config) {
        var $this = $(this);
        if (config.showAll) {
            var cfg = {};
            $.each($this, function(k, v){
                $.extend(cfg, config, {eles: $(v) });
                new pp(cfg);
            })
        } else {
            var cfg = {};
            $.extend(cfg, config, {eles: $this });
            new pp(cfg);
        }
    }

    function pp(config) {
        this.POSITIONS = {
            lt: 'LEFTTOP',
            rt: 'RIGHTTOP',
            rb: 'RIGHTBOTTOM',
            lb: 'LEFTBOTTOM',
            l: 'LEFT',//弹框右上角与触发元素左上角重合
            t: 'TOP',//弹窗左下角与触发元素左上角重合；
            r: 'RIGHT',//弹窗左上角与触发元素右上角重合；
            b: 'BOTTOM',//与默认设置相同；
            tm: 'TOPMIDDLE',
            rm: 'RIGHTMIDDLE',
            bm: 'BOTTOMMIDDLE',
            lm: 'LEFTMIDDLE',
            cur: 'CURSOR'
        }; //左上，右上，右下，左下
        this.defautlDir = 'b';

        var prms = {
            eles: '', //可以显示悬浮窗的元素，程序自动设置，用户设置无效；
            evt: '', //default: '';alternative: 'hover', 'click'
            dir: this.defautlDir, //default position：b/bottom；
            container: 'body',  //悬浮框的边界，默认为document文档的body内；
            beforeShow: function() {},//trigger before popup window showen；
            getContent: function(){}, //get popup window content；
            offset: 0,
            defEle: '', //默认显示弹窗的元素；只在未设置鼠标交互事件时启用；
            showAll: false,
            maxWidth: 0,
            autoAdjustDir: false,
            delta: 2  //
        };

        $.extend(prms, config);
        //get ride of unexpected dir value;
        (!this.POSITIONS[prms.dir]) && (prms.dir = this.defautlDir);
        this.params = prms;
        this._init();
    }

    pp.prototype = {
        _init: function() {
            var me = this;
            var eles = this.params.eles;
            this._drawHTML();
            me.rect = {}; //悬浮窗的左上角坐标和长宽；
            me.findCount = 0;

            me.POSTYPE = ['MIDDLE', 'CORNER', 'RECT', 'CUR'];
            me.RECTDIRS = ['RIGHT', 'BOTTOM', 'LEFT', 'TOP'];  //目前的适配参数；RECT模式下的适配.
            me.MDLDIRS = ['RIGHTMIDDLE', 'BOTTOMMIDDLE', 'LEFTMIDDLE', 'TOPMIDDLE'];//目前的适配参数；MIDDLE模式下的适配.

            me.dirsOppoRectDic = {RIGHT: 'LEFT', LEFT: 'RIGHT', TOP: 'BOTTOM', BOTTOM: 'TOP' };
            me.dirsOppoMdlDic = { RIGHTMIDDLE: 'LEFTMIDDLE', LEFTMIDDLE: 'RIGHTMIDDLE', TOPMIDDLE: 'BOTTOMMIDDLE', BOTTOMMIDDLE: 'TOPMIDDLE' };

            me._getZoomFactor();

            var ele = me.params.eles.filter(me.params.defEle);
            if(ele.length){
                me.params.origin = ele;
                me._showWin();
            }

            me._initEvt();
        },

        _initEvt: function(){
            var me = this;
            var eles = this.params.eles;
            var evt = this.params.evt;
            if(this.params.evt === 'hover'){
                eles.bind('mouseover.popup', function(e) {
                    me.params.cursorPosition = { x: e.pageX, y: e.pageY };
                    me.params.origin = $(this);
                    me._showWin();
                });
                eles.bind('mouseout.popup', function(e) {
                    me._hideWin();
                });
            }else if(this.params.evt === 'click'){
                eles.bind(evt + '.popup', function(e) {
                    me.params.origin = $(this);
                    me.params.cursorPosition = { x: e.pageX, y: e.pageY };
                    me._showWin();
                });
            }

            //注册浏览器缩放事件
            $(window).bind('resize.popup ', function(e){
                if(me.params.origin && me.params.origin.length){
                    //me._showWin();
                }
            })

        },

        _drawHTML: function() {
            var _html = '<div style="position: absolute;left: 0;top: 0;width: auto;height: auto;display: none;;white-space:nowrap;word-wrap:break-word;*zoom:1;"></div>';
            var obj = $(_html);
            this.params.dom = obj;
            //ie6多个父级元素具有定位属性时，定位会失败，zoom:1;处理bug
            $(this.params.container).css({'position': 'relative', zoom: 1}).append(obj);
        },

        //show popup window;
        _showWin: function() {
            var me = this;
            me.params.dom.hide();

            var pts = me.POSITIONS, dir = me.params.dir;
            me.params.dom.empty().append(me._getContent());//这里会清空getContent返回的内容，所以返回的内容应该动态生成；

            //enable max-width for dom;
            (me.params.maxWidth !== 0 && me.params.dom.outerWidth() > me.params.maxWidth) && me.params.dom.css('width', me.params.maxWidth);

            me.tempRectDir = [].concat(me.RECTDIRS);  //适配方向时的默认临时参数，会被更改；RECT模式下的适配.
            me.tempMdlDir = [].concat(me.MDLDIRS);  //适配方向时的默认临时参数，会被更改；MIDDLE模式下的适配.

            var po = me._getPositionExec(pts[dir]);
            if(po){
                //ie8以下浏览器在缩放时，某些级别有2像素的误差，导致文本意外换行，或超出边界；所以在计算时，需要考虑着2像素； 通过属性：this.params.delta 设置；
                //IE6 / 7 兼容，在这两个版本的浏览器上回自动折行；
                me.params.dom.css('width', parseInt(me.params.dom.width()) + me.params.delta + 'px');
                me.params.dom.css({'left': po.x, 'top': po.y}).show();
            }
        },

        _hideWin: function() {
            var me = this;
            me.params.dom.hide();
        },

        _getPositionExec: function(dir) {
            //获取弹窗的左上角；原则是弹窗不能压盖触发元素；//x>=0;y>=0
            var x = '', y = '';
            var me = this;

            var cp = me.params.cursorPosition || {};
            var adjustSuccess = true;

            var POS = me.POSTYPE;
            var po = '';

            me.curDir = dir;//add value;

            if(dir === 'CURSOR'){
                //2px的缓冲；
                x = cp.x + 2;
                y = cp.y + 2;
                po = POS[3];
            }

            if (adjustSuccess) {
                if(po === POS[3]) {
                    me._adjustCursorPostion(po);
                }else{
                    me._adjustRectPostion(po);
                }

                x = me.rect.x;
                y = me.rect.y;
            }
            me.tempRectDir = [];
            me.tempMdlDir = [];
            me.findCount = 0;
            if(x !== undefined && y !== undefined){
                return { x: (x + 'px'), y: (y + 'px') };
            }else{
                return null;
            }
        },

        _adjustRectPostion: function(){
            var me = this;
            //container;
            var ctn = $(me.params.container);
            var ctnOffset = ctn.offset();
            ctnOffset.left = Math.round(ctnOffset.left / me.zoomFactor);
            ctnOffset.top = Math.round(ctnOffset.top / me.zoomFactor);
            var ctnPdT = parseFloat(ctn.css('padding-top'));   //container padding-top;
            var ctnPdR = parseFloat(ctn.css('padding-right'));   //container padding-right;
            var ctnPdB = parseFloat(ctn.css('padding-bottom'));   //container padding-bottom;
            var ctnPdL = parseFloat(ctn.css('padding-left'));   //container padding-left;

            var ctnBdT = parseFloat(ctn.css('border-top-width'));   //container border-top;
            var ctnBdR = parseFloat(ctn.css('border-right-width'));   //container border-right;
            var ctnBdB = parseFloat(ctn.css('border-bottom-width'));   //container border-bottom;
            var ctnBdL = parseFloat(ctn.css('border-left-width'));   //container border-left;

            var ctnH0 = ctnBdT;
            var ctnW0 = ctnBdL;

            var ctnH = ctn.outerHeight() - ctnBdT - ctnBdB;
            var ctnW = ctn.outerWidth() - ctnBdL - ctnBdR;
            var ctnX = ctnOffset.left;
            var ctnY = ctnOffset.top;

            var ctnRECT = {x: 0, y: 0, w: ctnW, h: ctnH}

            //origin
            var origin = $(me.params.origin);
            var orgW = origin.outerWidth();
            var orgH = origin.outerHeight();
            var orgOffset = origin.offset();
            orgOffset.left = Math.round(orgOffset.left / me.zoomFactor);
            orgOffset.top = Math.round(orgOffset.top / me.zoomFactor);

            //relative to container;      
            var orgX = orgOffset.left - ctnOffset.left - ctnBdL;
            var orgY = orgOffset.top - ctnOffset.top - ctnBdT;

            //Popup
            var delta = me.params.delta;
            var rect = me.rect;
            var popupWin = me.params.dom;
            var x = 0;
            var y = 0;
            var w = popupWin.outerWidth() + delta; //TODO:bug  always add delta;
            var h = popupWin.outerHeight();
            var offset = me.params.offset;

            //anchor;
            var anchorX0;
            var anchorY0;

            var anchorP = {};

            var dir = me.curDir;

            //判断悬浮框和元素的高宽；来取中间点的坐标
            var deltaX = w - orgW >= 0 ? true : false;
            var deltaY = h - orgH >= 0 ? true : false;

            switch(dir){
                case 'LEFTMIDDLE'://左侧是否超过父容器，赞不做处理；
                    anchorX0 = w;
                    anchorY0 = h / 2;

                    x = orgX - offset - w;
                    y = orgY - (h - orgH) / 2;

                    if (w <= ctnRECT.w && h <= ctnRECT.h){//高宽超过文档范围的暂时不做处理；
                        if(y < ctnRECT.y){
                            y = ctnRECT.y;
                            anchorY0 = orgOffset.top - ctnOffset.top - ctnH0 + orgH / 2;
                        }
                        if(y + h > ctnRECT.h){
                            y = ctnRECT.h - h;
                            anchorY0 = orgOffset.top - ctnOffset.top - ctnH0 - y + orgH / 2;
                        }
                    }
                    break;
                case 'RIGHTMIDDLE'://右侧是否超过父容器，赞不做处理；
                    anchorX0 = 0;
                    anchorY0 = h / 2;

                    x = orgX + orgW + offset;
                    y = orgY + (orgH - h) / 2;

                    if (w <= ctnRECT.w && h <= ctnRECT.h){//高宽超过文档范围的暂时不做处理；
                        if(y < ctnRECT.y){
                            y = ctnRECT.y;
                            anchorY0 = orgOffset.top - ctnOffset.top - ctnH0 + orgH / 2;
                        }
                        if(y + h > ctnRECT.h){
                            y = ctnRECT.h - h;
                            anchorY0 = orgOffset.top - ctnOffset.top - ctnH0 - y + orgH / 2;
                        }
                    }
                    break;
                case 'TOPMIDDLE': //上侧是否超过父容器，赞不做处理；
                    anchorX0 = w / 2;
                    anchorY0 = h;

                    x = orgX - (w - orgW) / 2;
                    y = orgY - offset - h;

                    if (w <= ctnRECT.w && h <= ctnRECT.h){//高宽超过文档范围的暂时不做处理；
                        if(x < ctnRECT.x){
                            x = ctnRECT.x;
                            anchorX0 = orgOffset.left - ctnOffset.left - ctnW0 + orgW / 2;
                        }
                        if(x + w > ctnW){
                            x = ctnW - w;
                            anchorX0 = orgOffset.left - ctnOffset.left - ctnW0 - x + orgW / 2;
                        }
                    }
                    break;
                case 'BOTTOMMIDDLE'://下侧是否超过父容器，赞不做处理；
                    anchorX0 = w / 2;
                    anchorY0 = 0;

                    x = orgX - (w - orgW) / 2;
                    y = orgY + offset + orgH;

                    if (w <= ctnRECT.w && h <= ctnRECT.h){//高宽超过文档范围的暂时不做处理；
                        if(x < ctnRECT.x){
                            x = ctnRECT.x;
                            anchorX0 = orgOffset.left - ctnOffset.left - ctnW0 + orgW / 2;
                        }
                        if(x + w > ctnW){
                            x = ctnW - w;
                            anchorX0 = orgOffset.left - ctnOffset.left - ctnW0 - x + orgW / 2;
                        }
                    }
                    break;
                case 'LEFT':
                    //下侧超限，向上移；上侧最小值为0；
                    anchorX0 = w;
                    anchorY0 = deltaY ? orgH / 2 : h / 2;

                    x = orgX - w - offset;
                    y = orgY;

                    if(y + h > ctnRECT.h){
                        rect.y = ctnRECT.h - h;
                        anchorY0 = deltaY ? orgOffset.top - ctnOffset.top - ctnH0 - y + orgH / 2 : h / 2;
                    }
                    //左侧超限，dir为right
                    if(me.params.autoAdjustDir && x < ctnRECT.x){
                        me._getPositionExec(me._oppoDirect());
                        return;
                    }
                    break;
                case 'RIGHT':
                    //下侧超限，向上移；上侧最小值为0；
                    anchorX0 = 0;
                    anchorY0 = deltaY ? orgH / 2 : h / 2;

                    x = orgX + orgW + offset;
                    y = orgY;

                    if(y + h > ctnRECT.h){
                        rect.y = ctnRECT.h - h;
                        anchorY0 = deltaY ? orgOffset.top - ctnOffset.top - ctnH0 - y + orgH / 2 : h / 2;
                    }
                    //右侧超限，dir为left
                    if(me.params.autoAdjustDir && x + w > ctnRECT.w){
                        me._getPositionExec(me._oppoDirect());
                        return;//递归时会引起回调函数参数错误；
                    }
                    break;
                case 'TOP':
                    //右侧超限，向左移；左侧最小值为0；
                    anchorX0 = deltaX ? orgW / 2 : w / 2;
                    anchorY0 = h;

                    x = orgX;
                    y = orgY - h - offset;

                    if(x + w > ctnRECT.w){
                        rect.x = ctnRECT.w - w;
                        anchorX0 = deltaX ? orgOffset.left - ctnOffset.left - ctnW0 - x + orgW / 2 : w / 2;
                    }
                    //上部超限，dir为bottom
                    if(me.params.autoAdjustDir && y < ctnRECT.y){
                        me._getPositionExec(me._oppoDirect());
                        return;
                    }
                    break;
                case 'BOTTOM':
                    anchorX0 = deltaX ? orgW / 2 : w / 2;
                    anchorY0 = 0;

                    x = orgX;
                    y = orgY + orgH + offset;

                    //右侧超限，向左移；左侧最小值为0；
                    if(x + w > ctnRECT.w){
                        rect.x = ctnRECT.w - w;
                        anchorX0 = deltaX ? orgOffset.left - ctnOffset.left - ctnW0 - x + orgW / 2 : w / 2;
                    }
                    //下部超限，dir为top
                    if(me.params.autoAdjustDir && y + h > ctnRECT.h){
                        me._getPositionExec(me._oppoDirect());
                        return;
                    }
                    break;
                default:
                    ;
            }
            me._beforeShow(me.params.dom, anchorX0, anchorY0);


            rect.x = x;
            rect.y = y;
        },

        _adjustCursorPostion: function(){
            var me = this;
            var x0 = me.rect.x;
            var y0 = me.rect.y;
            me._beforeShow(me.params.dom, x0, y0);
        },

        _oppoDirect: function() {  //RECT
            var me = this, tempDir, dirsOpppDic, dir = me.curDir;

            if(me.tempRectDir.indexOf(dir) >= 0){
                tempDir = me.tempRectDir;
                dirsOpppDic = me.dirsOppoRectDic;
            }else{
                tempDir = me.tempMdlDir;
                dirsOpppDic = me.dirsOppoMdlDic;
            }

            if (tempDir && tempDir.length > 0) {
                tempDir.splice(tempDir.indexOf(dir), 1);
                var next = dirsOpppDic[dir];
                var idx = tempDir.indexOf(next);
                return idx >= 0 ? next : tempDir[0];
            } else {
                me.tempRectDir = [].concat(me.RECTDIRS);  //TODO:rectdirs and mdldirs;
                return me.POSITIONS[me.params.dir]; //return origin dir
            }
        },

        _getZoomFactor: function() {
            var factor = 1;
            if($.browser && $.browser.msie === true && $.browser.version === '7.0'){
                if (document.body.getBoundingClientRect) {
                    var rect = document.body.getBoundingClientRect();
                    var physicalW = rect.right - rect.left;
                    var logicalW = document.body.offsetWidth;
                    factor = Math.round((physicalW / logicalW) * 100) / 100;
                }
            }
            this.zoomFactor = factor;
        },

        _beforeShow: function(){
            var me = this;
            me.params.beforeShow.apply(me, arguments);
        },

        _getContent: function(){
            var me = this, origin = me.params.origin;
            var con = me.params.getContent.apply(me, [origin]);
            return con || '';
        }
    };

    $.fn.PopUp = popup;

})(jQuery, window, document);
