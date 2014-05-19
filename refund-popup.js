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

      me.POSTYPE = ['MIDDLE', 'CORNER', 'RECT', 'CUR'];
      me.RECTDIRS = ['RIGHT', 'BOTTOM', 'LEFT', 'TOP'];  //目前的适配参数；RECT模式下的适配.
      me.MDLDIRS = ['RIGHTMIDDLE', 'BOTTOMMIDDLE', 'LEFTMIDDLE', 'TOPMIDDLE'];//目前的适配参数；MIDDLE模式下的适配.

      me.dirsOppoRectDic = {RIGHT: 'LEFT', LEFT: 'RIGHT', TOP: 'BOTTOM', BOTTOM: 'TOP' };
      me.dirsOppoMdlDic = { RIGHTMIDDLE: 'LEFTMIDDLE', LEFTMIDDLE: 'RIGHTMIDDLE', TOPMIDDLE: 'BOTTOMMIDDLE', BOTTOMMIDDLE: 'TOPMIDDLE' };

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
      $(this.params.container).css('position','relative').append(obj);
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
        //ie8以下浏览器在缩放时，某些级别有2像素的误差，导致文本意外换行，或超出边界；所以在计算时，需要考虑着2像素；
        //IE6 / 7 兼容，在这两个版本的浏览器上回自动折行；
        me.params.dom.css('width', parseInt(me.params.dom.width()) + 2 + 'px');
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

      //container;
      var ctn = $(me.params.container);
      var ctnOffset = ctn.offset();
      var ctnBdL = parseFloat(ctn.css('border-left-width'));   //container border-left;
      var ctnBdT = parseFloat(ctn.css('border-top-width'));   //container border-top;

      //origin
      var origin = $(me.params.origin);
      var orgW = origin.outerWidth();
      var orgH = origin.outerHeight();
      var orgOffset = origin.offset();
      var orgX = orgOffset.left - ctnOffset.left - ctnBdL;
      var orgY = orgOffset.top - ctnOffset.top - ctnBdT;


      //popup
      var popupWin = me.params.dom;
      var pW = popupWin.outerWidth() + 2;
      var pH = popupWin.outerHeight();
      var cp = me.params.cursorPosition || {};
      var adjustSuccess = true;
      var delta = me.params.delta;

      var POS = me.POSTYPE;
      var po = '';

      me.curDir = dir;//add value;

      switch (dir) {
        case 'LEFT':
          x = orgX - pW - delta;
          y = orgY;
          po = POS[2];
          break;
        case 'TOP':
          x = orgX;
          y = orgY - pH - delta;
          po = POS[2];
          break;
        case 'RIGHT':
          x = orgX + orgW + delta;
          y = orgY;
          po = POS[2];
          break;
        case 'BOTTOM':
          x = orgX;
          y = orgY + orgH + delta;
          po = POS[2];
          break;
        case 'LEFTTOP':
          x = orgX - pW;
          y = orgY - pH;
          po = POS[1];
          break;
        case 'RIGHTTOP':
          x = orgX + orgW;
          y = orgY - pH;
          po = POS[1];
          break;
        case 'RIGHTBOTTOM':
          x = orgX + orgW;
          y = orgY + orgH;
          po = POS[1];
          break;
        case 'LEFTBOTTOM':
          x = orgX - pW;
          y = orgY + orgH;
          po = POS[1];
          break;
        case 'TOPMIDDLE':
          x = orgX - (pW - orgW) / 2;
          y = orgY - delta - pH;
          po = POS[0];
          break;
        case 'BOTTOMMIDDLE':
          x = orgX - (pW - orgW) / 2;
          y = orgY + delta + orgH;
          po = POS[0];
          break;
        case 'RIGHTMIDDLE':
          x = orgX + orgW + delta;
          y = orgY + (orgH - pH) / 2;
          po = POS[0];
          break;
        case 'LEFTMIDDLE':
          x = orgX - delta - pW;
          y = orgY - (pH - orgH) / 2;
          po = POS[0];
          break;
        case 'CURSOR': //2px的缓冲；
          x = cp.x + 2;
          y = cp.y + 2;
          po = POS[3];
          break;
        default: //下方
          x = orgX;
          y = orgY + orgH;
          dir = 'BOTTOM';
          po = POS[2];
          adjustSuccess = false;
          break;
      }

      $.extend(me.rect, { x: x, y: y, w: pW, h: pH });

      if (adjustSuccess) {
        if(po === POS[0]) {
          me._adjustMiddlePostion(po);
        } else if (po === POS[1]) {
          me._adjustCornerPost(po);
        } else if (po === POS[2]) {
          me._adjustRECTPostion(po);
        } else if (po === POS[3]) {
          me._adjustCursorPostion(po);
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

    _adjustMiddlePostion: function(){
      var me = this;
      var delta = 0;
      //container;
      var ctn = $(me.params.container);
      var ctnOffset = ctn.offset();
      var ctnPdT = parseFloat(ctn.css('padding-top'));   //container padding-top;
      var ctnBdT = parseFloat(ctn.css('border-top-width'));   //container border-top;
      var ctnPdL = parseFloat(ctn.css('padding-left'));   //container padding-left;
      var ctnBdL = parseFloat(ctn.css('border-left-width'));   //container border-left;
      var ctnH0 = ctnPdT + delta;  //padding-left and border-left-width;
      var ctnW0 = ctnPdL + delta;  //padding-top and border-top-width;
      var ctnH = ctn.outerHeight() - ctnH0;
      var ctnW = ctn.outerWidth() - ctnW0;
      var ctnX = ctnOffset.left + delta;
      var ctnY = ctnOffset.top + delta;

      //origin
      var origin = $(me.params.origin);
      var orgW = origin.outerWidth();
      var orgH = origin.outerHeight();
      var orgOffset = origin.offset();
      var orgX = orgOffset.left - ctnOffset.left - ctnBdL;
      var orgY = orgOffset.top - ctnOffset.top - ctnBdT;

      //Popup
      var rect = me.rect;
      var x = rect.x;
      var y = rect.y;
      var w = rect.w;
      var h = rect.h;


      //anchor;
      var anchorX0;
      var anchorY0;

      var anchorP = {};

      var dir = me.curDir;


      if (w <= ctnW && h <= ctnH) { //高宽超过文档范围的暂时不做处理；
        switch(dir){
          case 'LEFTMIDDLE'://左侧是否超过父容器，赞不做处理；
            anchorX0 = w;
            anchorY0 = h / 2;
            if(y < ctny){
              y = ctnH0 ;
              anchorY0 = orgOffset.top + orgH / 2;
            }
            if(y + h > ctnY + ctnH){
              y = ctnH - h;
              anchorY0 = orgOffset.top - y + orgH / 2;
            }
            break;
          case 'RIGHTMIDDLE'://右侧是否超过父容器，赞不做处理；
            anchorX0 = 0;
            anchorY0 = h / 2;
            if(y < ctnY){
              y = ctnH0;
              anchorY0 = orgOffset.top + orgH / 2;
            }
            if(y + h > ctnY + ctnH){
              y = ctnH - h;
              anchorY0 = orgOffset.top - y + orgH / 2;
            }
            break;
          case 'TOPMIDDLE': //上侧是否超过父容器，赞不做处理；
            anchorX0 = w / 2;
            anchorY0 = h;
            if(x < ctnW0){
              x = ctnW0;
              anchorX0 = orgOffset.left - ctnOffset.left - ctnW0 - ctnPdL+ orgW / 2;
            }
            if(x + w > ctnW){
              x = ctnW - w;
              anchorX0 = orgOffset.left - ctnOffset.left - x + orgW / 2;
            }
            break;
          case 'BOTTOMMIDDLE'://下侧是否超过父容器，赞不做处理；
            anchorX0 = w / 2;
            anchorY0 = 0;
            if(x < ctnW0){
              x = ctnW0;
              anchorX0 = orgOffset.left - ctnOffset.left - ctnW0 + orgW / 2;
            }
            if(x + w > ctnW){
              x = ctnW - w;
              anchorX0 = orgOffset.left - ctnOffset.left - x + orgW / 2;
            }
            break;
          default:
            ;
        }
        //add padding-left and border-left-width;
        rect.x = x;
        rect.y = y;
      }else{
        switch(dir){
          case 'LEFTMIDDLE'://左侧是否超过父容器，赞不做处理；
            anchorX0 = w;
            anchorY0 = h / 2;
            break;
          case 'RIGHTMIDDLE'://右侧是否超过父容器，赞不做处理；
            anchorX0 = 0;
            anchorY0 = h / 2;
            break;
          case 'TOPMIDDLE': //上侧是否超过父容器，赞不做处理；
            anchorX0 = w / 2;
            anchorY0 = h;
            break;
          case 'BOTTOMMIDDLE'://下侧是否超过父容器，赞不做处理；
            anchorX0 = w / 2;
            anchorY0 = 0;
            break;
          default:
            ;
        }
      }
      me._beforeShow(me.params.dom, anchorX0, anchorY0);
    },

    _adjustCornerPost: function(){
    },

    _adjustRECTPostion: function() {
    },

    _adjustCursorPostion: function(){
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