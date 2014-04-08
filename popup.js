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
            parent: 'body',
            position: 'lb'
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
                origin.bind('mouseover', function(e) {
                    me.params.cursorPosition = { x: e.pageX, y: e.pageY };
                    me._showWin();
                });
                origin.bind('mouseout', function(e) {
                    me._hideWin();
                });
            }else if(this.params.evt === 'click'){
                origin.bind(evt, function(e) {
                    me.params.cursorPosition = { x: e.pageX, y: e.pageY };
                    me._showWin();
                });
            } else{
                me._showWin();
            }
        },
        _drawHTML: function() {
            var _html = '<div class="popup"></div>';
            var obj = $(_html);
            this.params.popupWin = obj;
            $(this.params.parent).append(obj);
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
            me.params.popupWin.css('left', po.x).css('top', po.y).show();
        },

        _hideWin: function() {
            var me = this;
            me.params.popupWin.hide();
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

            return me._getRECTPositionExec(pts[po]);
        },

        _getRECTPositionExec: function(dir) { //获取弹窗的左上角；原则是弹窗不能压盖触发元素；//x>=0;y>=0

            var x = '', y = '';
            var me = this;
            var origin = me.params.origin;
            var oW = origin.width();
            var oH = origin.height();
            var lt = origin.offset();
            var popupWin = me.params.popupWin;
            var pW = popupWin.width();
            var pH = popupWin.height();
            var cp = me.params.cursorPosition;
            var adjustSuccess = true;
            var delta = 0;

            var POS = ['MIDDLE', 'CORNER', 'RECT'];
            var po = '';
            switch (dir) {
                case 'LEFT':
                    x = lt.left - pW;
                    y = lt.top;
                    po = POS[2];
                    break;
                case 'TOP':
                    x = lt.left;
                    y = lt.top - pH;
                    po = POS[2];
                    break;
                case 'RIGHT':
                    x = lt.left + oW;
                    y = lt.top;
                    po = POS[2];
                    break;
                case 'BOTTOM':
                    x = lt.left;
                    y = lt.top + oH;
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

            	    } else if (po === POS[2]) {
                    me._adjustRECTPostion(me.rect, dir);
            	    } else {

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
            //获取文档的宽度/高度；
            var dH = $(document).height();
            var dW = $(document).width();

            var x = rect.x;
            var y = rect.y;
            var w = rect.w;
            var h = rect.h;

            if (w <= dW && h <= dH) { //高宽超过文档范围的暂时不做处理；
                switch(dir){
                    case 'TOPMIDDLE': //上侧是否超过父容器，赞不做处理；
                        (x < 0) && (x = 0);
                        (x + w> dW) && (x = dW - w);
                        break;
                    case 'RIGHTMIDDLE'://右侧是否超过父容器，赞不做处理；
                        (y < 0) && (y = 0);
                        (y + h > dH) && (y = dH - h);
                        break;
                    case 'BOTTOMMIDDLE'://下侧是否超过父容器，赞不做处理；
                        (x < 0) && (x = 0);
                        (x + w> dW) && (x = dW - w);
                        break;
                    case 'LEFTMIDDLE'://左侧是否超过父容器，赞不做处理；
                        (y < 0) && (y = 0);
                        (y + h > dH) && (y = dH - h);
                        break;
                    default:
                        ;
                }
                rect.x = x;
                rect.y = y;
            }
        },

        _adjustRECTPostion: function(rect, dir) {
            var me = this;
            //获取文档的宽度/高度；
            var dH = $(document).height();
            var dW = $(document).width();

            var x = rect.x;
            var y = rect.y;
            var w = rect.w;
            var h = rect.h;

            if (w <= dW && h <= dH) { //高宽超过文档范围的暂时不做处理；
                switch (dir) {
                    case 'LEFT':
                        //下侧超限，向上移；上侧最小值为0；
                        (y + h > dH) && (rect.y = dH - h);
                        //左侧超限，dir为right
                        (x < 0) && (me._getRECTPositionExec(me._oppoDirect(dir)));
                        break;
                    case 'RIGHT':
                        //下侧超限，向上移；上侧最小值为0；
                        (y + h > dH) && (rect.y = dH - h);
                        //右侧超限，dir为left
                        (x + w > dW) && (me._getRECTPositionExec(me._oppoDirect(dir)));
                        break;
                    case 'TOP':
                        //右侧超限，向左移；左侧最小值为0；
                        (x + w > dW) && (rect.x = dW - w);
                        //上部超限，dir为bottom
                        (y < 0) && (me._getRECTPositionExec(me._oppoDirect(dir)));
                        break;
                    case 'BOTTOM':
                        //右侧超限，向左移；左侧最小值为0；
                        (x + w > dW) && (rect.x = dW - w);
                        //下部超限，dir为top
                        (y + h > dH) && (me._getRECTPositionExec(me._oppoDirect(dir)));
                        break;
                    default:
                        ;
                }

            }
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
            //realDir = this.exitDir.indexOf(oppo) > 0 ? me._nextDirect(oppo) : oppo{//已经存在的话，从dirs里面找， 否则直接返回对面放心的；
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