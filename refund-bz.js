
$(function() {
    var origData = QNR.PayInfo.refund;
    if(origData.ret && origData.data && origData.data.length>0){
        var data0 = origData.data[0];
        var allTipsObj = {};
        var actData;
        initRefundLine(data0.refundInfoGroup);
        initProc(data0.refundBarInfos);
        initPopupOther(data0);
        initEvt();
        //adjustEdge();
    }else if (origData.errcode === 100244 || origData.errcode === 100247){// no refund info;
        var errInfo = '<table class="z_notice_ctn" ><tbody><tr><td><div class="z_notice_icon_ctn"></div></td><td><div class="z_notice_txt"><p class="pay_sum">抱歉未查询到此订单的退款</p><p>有问题请咨询去哪儿网客服 10101234</p></div></td></tr></tbody></table>';
        $('.proc_detail').empty().append($(errInfo));
    }else if(origData.errcode === 100240){// no order info;
        var errInfo = '<table class="z_notice_ctn" ><tbody><tr><td><div class="z_notice_icon_ctn"></div></td><td><div class="z_notice_txt"><p class="pay_sum">抱歉未查询到此订单</p><p>有问题请咨询去哪儿网客服 10101234</p></div></td></tr></tbody></table>';
        $('.proc_detail').empty().append($(errInfo));
        $('.total').hide();
    }else{
        var errInfo = '<table class="z_notice_ctn" ><tbody><tr><td><div class="z_notice_icon_ctn"></div></td><td><div class="z_notice_txt"><p class="pay_sum">抱歉未查询到此订单</p><p>有问题请咨询去哪儿网客服 10101234</p></div></td></tr></tbody></table>';
        $('.proc_detail').empty().append($(errInfo));
        $('.total').hide();
    }

    function initProc(data){
        //退款步骤区域；
        if(!data || data.length === 0) return;
        strProc = '<td class="stat0 {stat}"><div class="proc"><span class="flag" step="{step}"></span></div></td>';
        //strDone = '<td class="stat0 stat1"><div class="proc"><span class="flag" step="{step}"></span></div></td>';
        //strTodo = '<td class="stat0"><div class="proc"><span class="flag" step="{step}"></span></div></td>';
        //strActive = '<td class="stat0 active"><div class="proc"><span class="flag" step="{step}"></span></div></td>';
        //strLast = '<td class="stat0 stat2"><div class="proc"><span class="flag" step="{step}"></span></div></td>';
        //strLastActive = '<td class="stat0 stat2 active1"><div class="proc"><span class="flag" step="{step}"></span></div></td>';

        var isActive = false;
        var procItems = [];
        for(var i=0,len=data.length;i<len;i++){
            var temp = data[i], str = '';

            (i === 0 || !isActive) && (str += 'stat1 ');

            (i === len-1) && (str += 'stat2 ');

            if(temp.active){
                str += (i === len-1) ? 'active1' : 'active ';
                isActive = true;
            }

            procItems.push(strProc.replace(/{step}/g, i).replace(/{stat}/g, str));

            allTipsObj[i] = '<div style="text-align:center;color:#999">' + temp.refundNode + '<br/>' + parseTime(temp.refundNodeTime && temp.refundNodeTime.time, true) + '</div>';
            if(temp.active){
                actData = temp;
            }
        }

        $('.graph .top').empty().append(procItems.join(''));

    }

    function parseTime(number, flag){
        var currentTime = new Date().getTime()
        if(!number) return '';
        var date = new Date(number);
        var y = date.getFullYear();
        var m = (m = date.getMonth() + 1 + '').length === 1 ? ('0' + m) : m;
        var d = (d = date.getDate() + '').length === 1 ? ('0' + d) : d;
        var h = (h = date.getHours() + '').length === 1 ? ('0' + h) : h;
        var min = (min = date.getMinutes() + '').length === 1 ? ('0' + min) : min;

        flagStr = flag && number > currentTime ? ' 之前' : '';
        return [y, m, d].join('-') + '  ' + [h, min].join(':') + flagStr;
    }

    function initPopupOther(data){
        var mod = '';
        //修改总额；
        $('#total').text(data.totalAmount);
        $('#refund_road').text((mod  = data.refundMode) !== '' ? '(' + mod + ')' : '');
        function activeFunc(){
            if(!actData) return;

            var tips1 = actData.refundTipOne;
            var tips2 = actData.refundTipTwo;

            $('.active .flag, .active1 .flag').PopUp({
                evt: 'click',
                dir: 'bm',
                container: '.proc_detail',
                defEle: ':first',
                offset: 8,
                maxWidth: 150,
                getContent: function(org) {
                    var line2Str = ($.trim(tips2) !== '') ? '<div class="line2">' + tips2 + '</div>' : '';
                    $('#proc_info_hide').html('<div class="line1">' + tips1 + '</div>' + line2Str).show();
                    return $( '<div class="popup_head"><div class="lg_explain_arrow"><span class="bottom1"></span><span class="bottom2"></span></div><div><div class="line1">' + tips1 + '</div>' + line2Str + '</div></div>');
                },
                beforeShow: function(dom, x, y){
                    console.log('x:     ' + x + '       y:      ' + y);
                }
            });
        }

        function allTipsFunc(){
            //退款状态
            $('#refund_stat').html(allTipsObj[0]).show();
            $('.flag').PopUp({evt: 'click', dir: 'bm',container: '.graph_wrapper',defEle: ':first', showAll: true, delta: 18,getContent: function(org) {return $(allTipsObj[org.attr('step')]);}});
        }

        activeFunc();
        //allTipsFunc();
    }

    function initRefundLine(data){
        if(!data) return;
        var lines = data;
        var len = lines.length;
        if(len === 1){
            parseProces(lines[0].refundInfoList, true);
        }else{
            for(var i=0;i<len;i++){
                var procs = lines[i].refundInfoList;
                parseProces(procs);
            }

        }

        function parseProces(steps, open){
            var lineHead = '<div class="clrfix item {down}"><div class="c1">{time}</div><div class="c2">{count}</div><div class="c3">{stat}</div><div class="c5">{info}</div><div class="c4 ctrl {hide}"><a href="javascript:;" class="more {down}"><span class="txt1">展开&nbsp;&nbsp;</span><span class="txt2">收起&nbsp;&nbsp;</span><span class="icon"></span></a></div><div class="more_detail">{more}</div></div>';
            var pData = {};
            var bData = [];
            var len = steps.length;

            for (var i = 0; i < len; i++) {
                var temp = steps[i];
                var time0 = parseTime(temp.refundTime && temp.refundTime.time);
                var count0 = temp.refundAmount;
                var stat0 = temp.refundNode;
                var info0 = temp.refundTipOne + temp.refundTipTwo;

                if(i < len - 1){
                    bData.push({time : time0, stat: stat0});
                }else{
                    //time,count,stat,info,ctrl
                    pData['time'] = time0;
                    pData['count'] = count0;
                    pData['stat'] = stat0;
                    pData['info'] = info0;
                }
            };
            //zheng zai chu li de xin xi;
            pData['more'] = initProcedInfo(bData);

            if(len === 1){
                pData['hide'] = 'hide';
                pData['down'] = '';
            }else{
                pData['hide'] = '';
                pData['down'] = open ? 'down' : ''; //add down class;
            }

            $('.detail_line .content').append($(replace(lineHead, pData)));
        }
    }

    function replace(str, data){
        if(!str) return '';
        var regex = /\{\s*(\w+)\s*\}/g;
        var str = str.replace(regex, function(d, c){return data[c] || '';});
        return  str;
    }

    function initProcedInfo(data){
        var str = '<span>{time}  {stat}</span>';
        var strStep = [];
        for(var i=0,len=data.length;i<len;i++){
            var temp = data[i];
            strStep.push(replace(str, temp));
        }

        return strStep.join('<span class="dir_icon">&nbsp;&nbsp;</span>');
    }

    function initEvt(){
        //展开隐藏动作
        var allDown = $('.detail_line .more');
        allDown.bind('click', function(e){
            var $this = $(this);
            allDown.not($this).removeClass('down');
            allDown.not($this).parents('.item').removeClass('down');
            $this.toggleClass('down');
            $this.parents('.item').toggleClass('down');
            e.preventDefault();
            $('.proc_container').data('jsb_data').update('relative');
        });


      //$('.proc_container').jscrollbar({ width:6, position:'outer',showXBar:false});
    }

    function adjustEdge(){
        var obj = $('.detail_line .content');
        var oOffset = obj.offset();
        var HEIGHT = 386;
        var h = oOffset.top;
        obj.css('height', HEIGHT - h + 'px');
    }
})
