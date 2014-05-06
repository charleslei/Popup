//TODO：三种模式下的适配方式是否应该一致？
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
    this.defautlDir = 'b';

    var prms = {
      eles: '', //可以显示悬浮窗的元素，程序自动设置，用户设置无效；
      evt: '', //default: '';alternative: 'hover', 'click'
      dir: this.defautlDir, //默认的悬浮框位置：b；
      container: 'body',  //悬浮框的边界，默认为document文档的body内；
      beforeShow: function() {},//悬浮框显示前的触发事件；
      getContent: function(){}, //获取悬浮框的内容；
      delta: 0,
      defEle: '', //默认显示弹窗的元素；只在未设置鼠标交互事件时启用；
      showAll: false,
      maxWidth: 0
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
      me.DIRS = ['RIGHT', 'BOTTOM', 'LEFT', 'TOP'];  //目前的适配参数；RECT模式下的适配.
      me.tempDir = [].concat(me.DIRS);  //适配方向时的默认临时参数，会被更改；RECT模式下的适配.

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

      //设置container的样式；
      //$(me.params.container).css('position', 'relative');
      //注册浏览器缩放事件
      $(window).bind('resize.popup ', function(e){
        if(me.params.origin && me.params.origin.length){
          me._showWin();
        }
      })
    },

    _getContent: function(){
      var me = this, origin = me.params.origin;
      var con = me.params.getContent(origin);
      return con || '';
    },

    _drawHTML: function() {
      var _html = '<div style="position: absolute;left: 0;top: 0;width: auto;height: auto;display: none;;white-space:nowrap;overflow:hidden"></div>';
      var obj = $(_html);
      this.params.dom = obj;
      $(this.params.container).append(obj);
    },

    //show popup window;
    _showWin: function() {
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
      var me = this;
      me.params.dom.hide();

      var pts = me.POSITIONS, dir = me.params.dir;
      me.params.dom.empty().append(me._getContent());//这里会清空getContent返回的内容，所以返回的内容应该动态生成；

      //enable max-width for dom;
      if(me.params.dom.outerWidth() > me.params.maxWidth){
        me.params.dom.css('width', me.params.maxWidth);
      }
      
      var po = me._getPositionExec(pts[dir]);
      po && me.params.dom.css({'left': po.x, 'top': po.y}).show();
    },

    _hideWin: function() {
      var me = this;
      me.params.dom.hide();
    },

    _getPositionExec: function(dir) {
      //获取弹窗的左上角；原则是弹窗不能压盖触发元素；//x>=0;y>=0
      var x = '', y = '';
      var me = this;
      var origin = me.params.origin;
      var oW = origin.outerWidth();
      var oH = origin.outerHeight();
      var lt = origin.offset();
      var popupWin = me.params.dom;
      var pW = popupWin.outerWidth();
      var pH = popupWin.outerHeight();
      var cp = me.params.cursorPosition || {};
      var adjustSuccess = true;
      var delta = me.params.delta;

      var POS = ['MIDDLE', 'CORNER', 'RECT', 'CUR'];
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
          y = lt.top - pH;
          po = POS[1];
          break;
        case 'RIGHTBOTTOM':
          x = lt.left + oW;
          y = lt.top + oH;
          po = POS[1];
          break;
        case 'LEFTBOTTOM':
          x = lt.left - pW;
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
          y = lt.top + delta + oH;
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
          po = POS[3];
          break;
        default: //下方
          x = lt.left;
          y = lt.top + oH;
          dir = 'BOTTOM';
          po = POS[2];
          adjustSuccess = false;
          break;
      }

      $.extend(me.rect, { x: x, y: y, w: pW, h: pH });

      if (adjustSuccess) {
        if(po === POS[0]) {
          me._adjustMiddlePostion(me.rect, dir, po);
        } else if (po === POS[1]) {
          me._adjustCornerPost(me.rect, dir, po);
        } else if (po === POS[2]) {
          me._adjustRECTPostion(me.rect, dir, po);
        } else if (po === POS[3]) {
          me._adjustCursorPostion(me.rect, dir, po);
        }
        x = me.rect.x;
        y = me.rect.y;
      }
      me.tempDir = [];
      me.findCount = 0;
      //if(x !== undefined && y !== undefined && !Number.isNaN(x) && !Number.isNaN(y)){
      if(x !== undefined && y !== undefined){
        return { x: (x + 'px'), y: (y + 'px') };
      }else{
        return null;
      }
    },

    _adjustMiddlePostion: function(rect, dir){
      var me = this;
      var ctn = me.params.container;
      var cH = $(ctn).outerHeight();
      var cW = $(ctn).outerWidth();
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
          default:
            ;
        }
        rect.x = x;
        rect.y = y;
      }else{
        switch(dir){
          case 'LEFTMIDDLE'://左侧是否超过父容器，赞不做处理；
            x0 = w;
            y0 = h / 2;
            break;
          case 'RIGHTMIDDLE'://右侧是否超过父容器，赞不做处理；
            x0 = 0;
            y0 = h / 2;
            break;
          case 'TOPMIDDLE': //上侧是否超过父容器，赞不做处理；
            x0 = w / 2;
            y0 = h;
            break;
          case 'BOTTOMMIDDLE'://下侧是否超过父容器，赞不做处理；
            x0 = w / 2;
            y0 = 0;
            break;
          default:
            ;
        }
      }
      me.params.beforeShow(me.params.dom, x0, y0);
    },

    _adjustCornerPost: function(rect, dir){
      var me = this;
      //TODO:
    },

    _adjustRECTPostion: function(rect, dir) {
      var me = this;
      var ctn = me.params.container;
      var cH = $(ctn).outerHeight();
      var cW = $(ctn).outerWidth();
      var cOffset = $(ctn).offset();
      var cx = cOffset.left;
      var cy = cOffset.top;

      var x = rect.x;
      var y = rect.y;
      var w = rect.w;
      var h = rect.h;

      var origin = me.params.origin;
      var oW = origin.outerWidth();
      var oH = origin.outerHeight();
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
        switch (dir) {//获取悬浮窗相对与元素之间的中心点；
          case 'LEFT':
            x0 = w;
            y0 = oH / 2;
            break;
          case 'RIGHT':
            x0 = 0;
            y0 = oH / 2;
            break;
          case 'TOP':
            x0 = oW / 2;
            y0 = h;
            break;
          case 'BOTTOM':
            x0 = oW / 2;
            y0 = 0;
            break;
          default:
            ;
        }
      }
      me.params.beforeShow(me.params.dom, x0, y0);
    },
	
	_adjustCursorPostion: function(){
	  var me = this;
	  var x0 = me.rect.x;
	  var y0 = me.rect.y;
      me.params.beforeShow(me.params.dom, x0, y0);
	},

    _oppoDirect: function(dir) {  //RECT
      var me = this, tempDir = me.tempDir;
      var dirsDic = {
        RIGHT: 'LEFT',
        LEFT: 'RIGHT',
        TOP: 'BOTTOM',
        BOTTOM: 'TOP'
      };

      if (tempDir && tempDir.length > 0) {
        tempDir.splice(tempDir.indexOf(dir), 1);
        var next = dirsDic[dir];
        var idx = tempDir.indexOf(next);
        return idx >= 0 ? next : tempDir[0];
      } else {
        me.tempDir = [].concat(me.DIRS);
        return me.POSITIONS[me.params.dir]; //return origin dir
      }
    }
  };

  $.fn.PopUp = popup;

})(jQuery, window, document);
