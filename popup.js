(function($, win, doc) {
    function popup(config) {
        var me = $(this);
        var cfg = { origin: me};
        //var cfg = $({}, config); 这是错误的用法；
        $.extend(cfg, config);
        new pp(cfg);
    }

    function pp(config) {
        var prms = {
            origin: '',
            evt: '', //default: '';alternative: 'hover', 'click'
            position: 'lb',
            container: 'body',
            beforeShow: function() {},
            getContent: function(){},
            delta: 0
        };
        $.extend(prms, config);
        this.params = prms;
        this._init();
    }

    pp.prototype = {
        _init: function() {
            var me = this;
            var origin = this.params.origin;
            var evt = this.params.evt;
            this._drawHTML();
            me.rect = {};
            this.exitDir = '';
            me.findCount = 0;

            if(this.params.evt === 'hover'){
                origin.bind('mouseover.popup', function(e) {
                    me.params.cursorPosition = { x: e.pageX, y: e.pageY };
                    me._showWin();
                });
                origin.bind('mouseout.popup', function(e) {
                    me._hideWin();
                });
            }else if(this.params.evt === 'click'){
                origin.bind(evt + '.popup', function(e) {
                    me.params.cursorPosition = { x: e.pageX, y: e.pageY };
                    me._showWin();
                });
            } else{
                me._showWin();
            }
            
            //设置container的样式；
            //$(me.params.container).css('position', 'relative');
            //注册浏览器缩放事件
            $(window).bind('resize.popup ', function(e){
                me._showWin();
            })
        },
        _drawHTML: function() {
            var _html = '<div class="popup"></div>';
            var obj = $(_html);
            this.params.dom = obj;
            $(this.params.container).append(obj);            
            var con = this.params.getContent();
            obj.append(con);
        },

        //show popup window;
        _showWin: function() {
            var me = this;
            /*
                显示位置的说明：
                1、默认弹框左上角与触发元素的左下角重合；左右自适应；
                2、可设置的值有：
                    a：left；弹框右上角与触发元素左上角重合；
                    b：top；弹窗左下角与触发元素左上角重合；
                    c：right；弹窗左上角与触发元素右上角重合；
                    d：bottom；与默认设置相同；
                    e：mouse；弹窗左上角为鼠标位置；左右位置可自适应；
                */

            var po = me._getPosition(me.params.position);
            me.params.dom.css('left', po.x).css('top', po.y).show();
        },

        _hideWin: function() {
            var me = this;
            me.params.dom.hide();
        },

        _getPosition: function(po) {
            var me = this;
            var pts = {
                lt: 'LEFTTOP',
                rt: 'RIGHTTOP',
                rb: 'RIGHTBOTTOM',
                lb: 'LEFTBOTTOM',
                l: 'LEFT',
                t: 'TOP',
                r: 'RIGHT',
                b: 'BOTTOM',
                tm: 'TOPMIDDLE',
                rm: 'RIGHTMIDDLE',
                bm: 'BOTTOMMIDDLE',
                lm: 'LEFTMIDDLE',
                cur: 'CURSOR'
            }; //左上，右上，右下，左下

            return me._getPositionExec(pts[po]);
        },

        _getPositionExec: function(dir) { //获取弹窗的左上角；原则是弹窗不能压盖触发元素；//x>=0;y>=0

            var x = '', y = '';
            var me = this;
            var origin = me.params.origin;
            var oW = origin.width();
            var oH = origin.height();
            var lt = origin.offset();
            var popupWin = me.params.dom;
            var pW = popupWin.width();
            var pH = popupWin.height();0
            var cp = me.params.cursorPosition;
            var adjustSuccess = true;
            var delta = me.params.delta;

            var POS = ['MIDDLE', 'CORNER', 'RECT'];
            var po = '';
            switch (dir) {
                case 'LEFT':
                    x = lt.left - pW - delta;
                    y = lt.top;
                    po = POS[2];
                    break;
                case 'TOP':
                    x = lt.left;
                    y = lt.top - pH - delta;
                    po = POS[2];
                    break;
                case 'RIGHT':
                    x = lt.left + oW + delta;
                    y = lt.top;
                    po = POS[2];
                    break;
                case 'BOTTOM':
                    x = lt.left;
                    y = lt.top + oH + delta;
                    po = POS[2];
                    break;
                case 'LEFTTOP':
                    x = lt.left - pW;
                    y = lt.top - pH;
                    po = POS[1];
                    break;
                case 'RIGHTTOP':
                    x = lt.left + oW;
                    y = lt.top;
                    po = POS[1];
                    break;
                case 'RIGHTBOTTOM':
                    x = lt.left + oW;
                    y = lt.top + oH;
                    po = POS[1];
                    break;
                case 'LEFTBOTTOM':
                    x = lt.left;
                    y = lt.top + oH;
                    po = POS[1];
                    break;
                case 'TOPMIDDLE':
                    x = lt.left - (pW - oW) / 2;
                    y = lt.top - delta - pH;
                    po = POS[0];
                    break;
                case 'RIGHTMIDDLE':
                    x = lt.left + oW + delta;
                    y = lt.top + (oH - pH) / 2;
                    po = POS[0];
                    break;
                case 'BOTTOMMIDDLE':
                    x = lt.left - (pW - oW) / 2;
                    y = lt.top + delta + oH
                    po = POS[0];
                    break;
                case 'LEFTMIDDLE':
                    x = lt.left - delta - pW;
                    y = lt.top - (pH - oH) / 2;
                    po = POS[0];
                    break;
                case 'CURSOR': //2px的缓冲；
                    x = cp.x + 2;
                    y = cp.y + 2;
                    break;
                default: //下方
                    x = lt.left;
                    y = lt.top + oH;
                    dir = 'BOTTOM';
                    adjustSuccess = false;
                    break;
            }

            $.extend(me.rect, { x: x, y: y, w: pW, h: pH });

            if (adjustSuccess) {
                    if(po === POS[0]) {
                        me._adjustMiddlePostion(me.rect, dir);
                    } else if (po === POS[1]) {
                        //TODO:
                    } else if (po === POS[2]) {
                        me._adjustRECTPostion(me.rect, dir);
                    }
                x = me.rect.x;
                y = me.rect.y;
            }
            me.exitDir = '';
            me.findCount = 0;
            return { x: x + 'px', y: y + 'px' };
        },

        _adjustMiddlePostion: function(rect, dir){
            var me = this;
            var ctn = me.params.container;
            var cH = $(ctn).height();
            var cW = $(ctn).width();
            var cOffset = $(ctn).offset();
            var cx = cOffset.left;
            var cy = cOffset.top;
            
            var x = rect.x;
            var y = rect.y;
            var w = rect.w;
            var h = rect.h;
            var x0;
            var y0;
            var anchorP = {};

            if (w <= cW && h <= cH) { //高宽超过文档范围的暂时不做处理；
                switch(dir){
                    case 'TOPMIDDLE': //上侧是否超过父容器，赞不做处理；
                        x0 = w / 2;
                        y0 = h;
                        if(x < cx){
                            x = cx;
                            x0 = w / 2 - (x - rect.x);;
                        }
                        if(x + w > cx + cW){
                            x = cx + cW - w + 1;
                            x0 = w / 2 + rect.x - x ;
                        }
                        break;
                    case 'RIGHTMIDDLE'://右侧是否超过父容器，赞不做处理；
                        x0 = 0;
                        y0 = h / 2;
                        if(y < cy){
                            y = cy;
                            y0 = h / 2 - (y - rect.y);
                        }
                        if(y + h > cy + cH){
                            y = cy + cH - h + 1;
                            y0 = h / 2 + rect.y - y;
                        }
                        break;
                    case 'BOTTOMMIDDLE'://下侧是否超过父容器，赞不做处理；
                        x0 = w / 2;
                        y0 = 0;
                        if(x < cx){
                            x = cx;
                            x0 = w / 2 - (x - rect.x);;
                        }
                        if(x + w > cx + cW){
                            x = cx + cW - w + 1;
                            x0 = w / 2 + rect.x - x ;
                        }
                        break;
                    case 'LEFTMIDDLE'://左侧是否超过父容器，赞不做处理；
                        x0 = w;
                        y0 = h / 2;
                        if(y < cy){
                            y = cy;
                            y0 = h / 2 - (y - rect.y);
                        }
                        if(y + h > cy + cH){
                            y = cy + cH - h + 1;
                            y0 = h / 2 + rect.y - y;
                        }
                        break;
                    default:
                        ;
                }
                rect.x = x;
                rect.y = y;
            }else{
                switch(dir){
                    case 'TOPMIDDLE': //上侧是否超过父容器，赞不做处理；
                        x0 = w / 2;
                        y0 = h;
                        break;
                    case 'RIGHTMIDDLE'://右侧是否超过父容器，赞不做处理；
                        x0 = 0;
                        y0 = h / 2;
                        break;
                    case 'BOTTOMMIDDLE'://下侧是否超过父容器，赞不做处理；
                        x0 = w / 2;
                        y0 = 0;
                        break;
                    case 'LEFTMIDDLE'://左侧是否超过父容器，赞不做处理；
                        x0 = w;
                        y0 = h / 2;
                        break;
                    default:
                        ;
                }
            }
            me.params.beforeShow(me.params.dom, x0, y0);
        },

        _adjustRECTPostion: function(rect, dir) {
            var me = this;
            var ctn = me.params.container;
            var cH = $(ctn).height();
            var cW = $(ctn).width();
            var cOffset = $(ctn).offset();
            var cx = cOffset.left;
            var cy = cOffset.top;

            var x = rect.x;
            var y = rect.y;
            var w = rect.w;
            var h = rect.h;

            var origin = me.params.origin;
            var oW = origin.width();
            var oH = origin.height();
            var oOffset = origin.offset();
            var ox = oOffset.left;
            var oy = oOffset.top;

            var x0;
            var y0;
            var delta = me.params.delta;

            //判断悬浮框和元素的高宽；来取中间点的坐标
            var deltaX = w - oW >= 0 ? true : false;
            var deltaY = h - oH >= 0 ? true : false;

            if (w <= cW && h <= cH) { //高宽超过文档范围的暂时不做处理；
                switch (dir) {
                    case 'LEFT':
                        //下侧超限，向上移；上侧最小值为0；
                        x0 = w;
                        y0 = deltaY ? oH / 2 : h / 2;

                        if(y + h > cy + cH){
                            rect.y = cy + cH - h + 1;
                            y0 = deltaY ? oH / 2 + y + h - cy - cH : h / 2;
                        }
                        //左侧超限，dir为right
                        if(x < cx){
                            me._getPositionExec(me._oppoDirect(dir));
                            return;
                        }
                        break;
                    case 'RIGHT':
                        //下侧超限，向上移；上侧最小值为0；
                        x0 = 0;
                        y0 = deltaY ? oH / 2 : h / 2;
                        if(y + h > cy + cH){
                            rect.y = cy + cH - h + 1;
                            y0 = deltaY ? oH / 2 + y + h - cy - cH : h / 2;
                        }
                        //右侧超限，dir为left
                        if(x + w > cx + cW){
                            me._getPositionExec(me._oppoDirect(dir));
                            return;//递归时会引起回调函数参数错误；
                        }
                        break;
                    case 'TOP':
                        //右侧超限，向左移；左侧最小值为0；
                        x0 = deltaX ? oW / 2 : w / 2;
                        y0 = h;
                        if(x + w > cx + cW){
                            rect.x = cx + cW - w + 1;
                            x0 = deltaX ? oW / 2 + x + w - cx - cW : w / 2;
                        }
                        //上部超限，dir为bottom
                        if(y < cy){
                            me._getPositionExec(me._oppoDirect(dir));
                            return;
                        }
                        break;
                    case 'BOTTOM':
                        x0 = deltaX ? oW / 2 : w / 2;
                        y0 = 0;
                        //右侧超限，向左移；左侧最小值为0；
                        if(x + w > cx + cW){
                            rect.x = cx + cW - w + 1;
                            x0 = deltaX ? oW / 2 + x + w - cx - cW : w / 2;
                        }
                        //下部超限，dir为top
                        if(y + h > cH + cy){
                            me._getPositionExec(me._oppoDirect(dir));
                            return;
                        }
                        break;
                    default:
                        ;
                }
            }else{
                switch (dir) {
                    case 'LEFT':
                        //下侧超限，向上移；上侧最小值为0；
                        x0 = w;
                        y0 = oH / 2;
                        break;
                    case 'RIGHT':
                        //下侧超限，向上移；上侧最小值为0；
                        x0 = 0;
                        y0 = oH / 2;
                        break;
                    case 'TOP':
                        //右侧超限，向左移；左侧最小值为0；
                        x0 = oW / 2;
                        y0 = h;
                        break;
                    case 'BOTTOM':
                        x0 = oW / 2;
                        y0 = 0;
                        //右侧超限，向左移；左侧最小值为0；
                        break;
                    default:
                        ;
                }
            }
            me.params.beforeShow(me.params.dom, x0, y0);
        },

        _oppoDirect: function(dir) {
            var me = this;
            var dirsDic = {
                RIGHT: 'LEFT',
                LEFT: 'RIGHT',
                TOP: 'BOTTOM',
                BOTTOM: 'TOP'
            };
            var oppo = dirsDic[dir];
            me.exitDir += "_" + dir;
            me.findCount += 1;
            if (me.exitDir.indexOf(oppo) >= 0) {
                return me._nextDirect(oppo);
            } else {
                return oppo;
            }
        },

        _nextDirect: function(current) { //TODO:循环一遍就跳出；
            var me = this,
                realDir;
            var dirs = ['RIGHT', 'BOTTOM', 'LEFT', 'TOP'];
            me.exitDir += " " + current;
            me.findCount += 1;
            //realDir = this.exitDir.indexOf(oppo) > 0 ? me._nextDirect(oppo) : oppo{//已经存在的话，从dirs里面找， 否则直接返回对面方向的；
            var idx = dirs.indexOf(current) + 1;
            (idx === dirs.length) && (idx = 0);
            realDir = dirs[idx];
            if (me.exitDir.indexOf(realDir) >= 0) {
                if (me.findCount >= 6) { //这里为什么是6呢？
                    return '';
                } else {
                    me._nextDirect(realDir);
                }
            } else {
                return realDir;
            }
        }
    };

    $.fn.PopUp = popup;

})(jQuery, window, document);
