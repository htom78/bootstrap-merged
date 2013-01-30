
// main code
$(document).ready(function() {
	
	/** general classes **/
	function isIE8() {
		return $.browser.msie && $.browser.version == 8;
	}

    if($("#lastDayModal").length > 0) {
        loadModal("#lastDayModal");
    }


    var highlightProductInput = function(elem) {
        // no effect now
    }
    /* DiscountItemModelView */
    var DiscountItemModelView = function(item) {
        var _this = this;
        
        /* 辅助函数 */
        this._updateDiscountFields = function(value, inputType) {
            if(_this.discountType() === 'D') {
                _this.focusPosition(0);
                _this.zhekou(value);
                _this.jianjia( parseFloat((Math.floor((_this.price-value*_this.price/10)*100+0.00001)/100).toFixed(2)) );
                _this.zhehoujia( parseFloat((_this.price-_this.jianjia()).toFixed(2)) );
                _this.min_price_after( parseFloat(( Math.floor(_this.min_price*value/10.0*100+0.0001)/100 ).toFixed(2)) );
                _this.max_price_after( parseFloat(( Math.floor(_this.max_price*value/10.0*100+0.0001)/100 ).toFixed(2)) );
            }
            else if(_this.discountType() === 'P') {
                if(inputType !== 'zhehoujia') {
                    _this.focusPosition(1);
                    _this.jianjia( value );
                    _this.zhehoujia( parseFloat((_this.price - value).toFixed(2)) );
                    _this.zhekou( parseFloat((Math.floor(_this.zhehoujia()/_this.price*10*100+0.00001)/100).toFixed(2)) );
                    _this.min_price_after( parseFloat((_this.min_price - value).toFixed(2)) );
                    _this.max_price_after( parseFloat((_this.max_price - value).toFixed(2)) );
                }
                else {
                    _this.focusPosition(2);
                    _this.zhehoujia( value );
                    _this.jianjia( parseFloat((_this.price - value).toFixed(2)) );
                    _this.zhekou( parseFloat((Math.floor(_this.zhehoujia()/_this.price*10*100+0.00001)/100).toFixed(2)) );
                    _this.min_price_after( parseFloat((_this.min_price - _this.jianjia()).toFixed(2)) );
                    _this.max_price_after( parseFloat((_this.max_price - _this.jianjia()).toFixed(2)) );
                }
            }
            if(_this.isChanged()) _this.dirty(true);
        };
        this._checkDiscountValid = function() {
            var zhekou = $.trim(_this.zhekou());
            var jianjia = $.trim(_this.jianjia());
            var zhehoujia = $.trim(_this.zhehoujia());
            var min_price = $.trim(_this.min_price_after());
            if(zhekou == "" || jianjia == "" || zhehoujia == "") {
                _this.isDiscountValid(false);
                _this.discountErrorMsg('折扣不能为空');
            }
            else if(!zhekou || isNaN(zhekou)) {
                _this.isDiscountValid(false);
                if(zhekou == "NaN") {
                    _this.zhekou('请修改');
                }
                if(jianjia == "NaN") {
                    _this.jianjia('请修改');
                }
                if(zhehoujia == "NaN") {
                    _this.zhehoujia('请修改');
                }
                _this.discountErrorMsg('折扣格式错误');
            }
            else if(zhekou < 0.01) {
                _this.discountErrorMsg('折扣不能小于0.01折');
                _this.isDiscountValid(false);
            }
            else if(zhekou > 10) {
                _this.discountErrorMsg('折扣不能大于10折');
                _this.isDiscountValid(false);
            }
            else if(_this.isMultiplePrice && (isNaN(min_price) || min_price <= 0)) {
                _this.focusPosition(2);
                _this.discountErrorMsg('宝贝最低价打折以后不能小于0（现在是<strong>'+ parseFloat(min_price) +'</strong>)');
                _this.isDiscountValid(false);
            }
            else {
                _this.isDiscountValid(true);
            }
        };
        
        this.pic_url = item.pic_url;
        this.num_iid = item.num_iid;
        this.title = item.title;
        this.price = +item.price;
        this.outer_id = item.outer_id
        this.product_id = item.product_id
        this.min_price = +item.min_price || 0;
        this.max_price = +item.max_price || 0;
        this.is_new = item.is_new;

        this.old_d_type = item.old_d_type || 'D';
        this.old_d_value = +item.old_d_value || 1000;

        this.price = parseFloat(this.price.toFixed(2));
        this.min_price = parseFloat(this.min_price.toFixed(2));
        this.max_price = parseFloat(this.max_price.toFixed(2));

        this.isMultiplePrice = (this.max_price > 0);
        this.min_price_after = ko.observable(this.min_price);
        this.max_price_after = ko.observable(this.max_price);

        /* 折扣部分 */
        this.isDiscountValid = ko.observable(true);
        this.discountErrorMsg = ko.observable('');
        this.focusPosition = ko.observable(-1); // 现在在改那个input, 0:打折 1:减价 2:折后价
        
        this.discountType = ko.observable(item.d_type || 'D');
        this.dirty = ko.observable(false);
        this.discountType.subscribe(function() {
            if(_this.isChanged()) _this.dirty(true);
        });


        this.discountValue = function() {
            if(_this.discountType() == 'D') return parseInt((+_this.zhekou()+0.00001)*100);
            else return parseInt((+_this.jianjia()+0.00001)*100);
        };

        this.isChanged = function() {
            if (_this.old_d_type == _this.discountType() && _this.old_d_value == _this.discountValue()) return false;
            else return true;
        }

        this.zhekou = ko.observable(10);
        this.jianjia = ko.observable(0);
        this.zhehoujia = ko.observable(+item.price);

        if(typeof item.d_value !== "undefined") {
            this._updateDiscountFields(parseFloat(item.d_value/100.0));
            this._checkDiscountValid();
        }

        this.zhekouInput = ko.computed({
            read: function() {
                return _this.zhekou();
            },
            write: function(value) {
                _this.discountType('D');
                _this._updateDiscountFields(value);
                _this._checkDiscountValid();
                if(_this.isDiscountValid()) {
                    highlightProductInput($("#"+_this.num_iid));
                }
            }
        });
        this.jianjiaInput = ko.computed({
            read: function() {
                return _this.jianjia();
            },
            write: function(value) {
                _this.discountType('P');
                _this._updateDiscountFields(value);
                _this._checkDiscountValid();
                if(_this.isDiscountValid()) {
                    highlightProductInput($("#"+_this.num_iid));
                }
            }
        });
        this.zhehoujiaInput = ko.computed({
            read: function() {
                return _this.zhehoujia();
            },
            write: function(value) {
                _this.discountType('P');
                _this._updateDiscountFields(value, 'zhehoujia');
                _this._checkDiscountValid();
                if(_this.isDiscountValid()) {
                    highlightProductInput($("#"+_this.num_iid));
                }
            }
        });

        this.multiplePriceDiscountMsg = ko.computed(function() {
            if(_this.discountType() === 'D') {
                return '每个价格<strong>打'+_this.zhekou()+'折</strong>：<br>'+_this.min_price_after()+' ~ '+_this.max_price_after()+' 元';
            }
            else if(_this.discountType() === 'P') {
                return '每个价格<strong>减'+_this.jianjia()+'元</strong>：<br>'+_this.min_price_after()+' ~ '+_this.max_price_after()+' 元';
            }
        }).extend({throttle: 50});
        this.multiplePriceDiscountText = ko.computed(function() {
            if(_this.discountType() === 'D') {
                return '打折';
            }
            else if(_this.discountType() === 'P') {
                return '减价';
            }
        }).extend({throttle: 50});

        this.recommendMsg = ko.observable('');
        this.isRecommendVisible = ko.observable(false);
        this.isRecommendValid = ko.observable(false);
        this.recomendDiscount = '';
        this.showRecommend = function() {
            var pid = _this.product_id;
            _this.isRecommendVisible(true);
            if(_this.recomendDiscount === '') {
                _this.recommendMsg('正在计算...');
                $.post('/recommend/item-discount', {product_id: pid, t: Math.random()}, function(res) {
                    if(res.success) {
                        _this.recomendDiscount = parseFloat((parseFloat(res.price)/_this.price*10).toFixed(2));
                    }
                    _this.updateRecommendMsg();
                }, 'json');
            }
            else {
                _this.updateRecommendMsg();
            }
        }
        this.hideRecommend = function() {
            _this.isRecommendVisible(false);
        }
        this.updateRecommendMsg = function() {
            var rd = _this.recomendDiscount;
            if(rd === '' || rd > 9.99) {
                _this.recommendMsg('不打折');
                _this.isRecommendValid(false);
                _gaq.push(['_trackEvent', 'RecommendDiscount', 'result_budazhe', 'actStep3Page']);
            }
            else if(rd < 1) {
                _this.recommendMsg('暂无');
                _this.isRecommendValid(false);
                _gaq.push(['_trackEvent', 'RecommendDiscount', 'result_zanwu', 'actStep3Page']);
            }
            else {
                _this.recommendMsg(''+rd+'折');
                _this.isRecommendValid(true);
                _gaq.push(['_trackEvent', 'RecommendDiscount', 'result_dazhe', 'actStep3Page']);
            }
        }
        this.setRecommendDiscount = function() {
            _this.zhekouInput(_this.recomendDiscount);
            _this.hideRecommend();
            _gaq.push(['_trackEvent', 'RecommendDiscount', 'click_yes', 'actStep3Page']);
        }
        
    }
    /* end of DiscountItemModelView */

	/* menu */

	/*** style */
	$(".topMenu .subMenu").each(function() {
		var sub = $(this);
		var parent = sub.parent();
		var top = parent.offset().top + parent.height();
		var width = parent.width() - 1;
		
		sub.css({
			"width": width,
			"top": top
		});
	});
	/*** effect */
	$("li.lv1").hover(
		function() {
			var li = $(this);
			var submenu = $(".subMenu", li);
			if(submenu.length > 0) {
				submenu.show();
			}	
		},
		function() {
			var li = $(this);
			var submenu = $(".subMenu", li);
			if(submenu.length > 0) {
				submenu.hide();
			}	
		}
	);
	$("li.lv2").hover(
		function() {
			var li = $(this);
			var submenu = $(".intro", li);
			if(submenu.length > 0) {
				submenu.show();
			}	
		},
		function() {
			var li = $(this);
			var submenu = $(".intro", li);
			if(submenu.length > 0) {
				submenu.hide();
			}	
		}
	);
    // update menu style
    var bodyId = $("body").attr("id");
    if(bodyId === 'mixlistPage') {
        $("#mainMenu li.lv1").eq(0).find("a:eq(0)").addClass("active");
    }
    else if(bodyId.indexOf('actStep') !== -1 || bodyId.indexOf('mjsStep') !== -1) {
        $("#mainMenu li.lv1").eq(1).find("a:eq(0)").addClass("active");
    }
    else if(bodyId === 'zkzqPage') {
        $("#mainMenu li.lv1").eq(2).find("a:eq(0)").addClass("active");
    }
    else if(bodyId === 'promoToolsPage') {
        //$("#mainMenu li.lv1").eq(3).find("a:eq(0)").addClass("active");
    }
    else if(bodyId === 'postfeePage') {
    	$("#mainMenu li.lv1").eq(3).find("a:eq(0)").addClass("active");
    }
    else if(bodyId === 'upgradePage') {
        $("#rightMenu .upgradeLink").addClass("active");
    }
    else if(bodyId === 'subUserPage' || bodyId === 'userInfoPage') {
        $("#rightMenu .userMenu").addClass("active");
    }
    else if(bodyId === 'invitePage') {
        $("#rightMenu .inviteLink").addClass("active");
    }
	/* end of menu */
	
	/* general */
	$("input.default, textarea.default").live("focus", function() {
		var input = $(this);
		input.data("defaultText", input.val());
		input.val("");
		input.removeClass("default").addClass("withoutDefault");
	});
	$("input.withoutDefault, textarea.withoutDefault").live("blur", function() {
		var input = $(this);
		if(input.val() === "") {
			input.val(input.data("defaultText"));
			input.removeClass("withoutDefault").addClass("default");
		}
	});

    $("img.lazy").lazyload();
	
	/* gotop/bottom buttons */
	var positionScrollButtons = function() {
        var sb = $("#scrollButtons");
        if(sb.length > 0 && $("#content").length > 0) {
    		$("a", sb).hide();
    		sb.css({
                left: $("#content").offset().left + $("#content").width() + 10,
                right: 'auto',
                top: 'auto',
                bottom: 10
            }).show();
            if(sb.offset().left + 42 > $(window).width()) {
                sb.css({
                    left: 'auto',
                    right: 0
                })
            }
            var footer = $("#footer");
            if(footer.offset().top + footer.height() < $(window).height()) {
                sb.css({
                    top: footer.offset().top + footer.height() - 50,
                    bottom: 'auto'
                });
            }
        }
	}
	var updateScrollButtonsVisibility = function() {
		if($(document).height() - $(window).scrollTop() > $(window).height()) {
			$("#goBottomButton").show();
		}
		else {
			$("#goBottomButton").hide();
		}
        if($(window).scrollTop() > 10) {
            $("#goTopButton").show();
        }
        else {
            $("#goTopButton").hide();
        }
        $("#kefuButton").show();
	}
    $("#goBottomButton").click(function() {
        $( 'html, body' ).animate( {
            scrollTop: $(document).height()
        }, 'fast' );
    });
    $("#goTopButton").click(function() {
        $( 'html, body' ).animate( {
            scrollTop: 0
        }, 'fast' );
    });
	positionScrollButtons();
	updateScrollButtonsVisibility();
	$(window).scroll(function() {
		updateScrollButtonsVisibility();
	});
    $(window).resize(function() {
        positionScrollButtons();
        updateScrollButtonsVisibility();
    });
    $("#scrollButtons a[data-tooltiptext]").hover(
        function(e) {
            var a = $(this);
            var tooltip = $("#leftTooltip");
            var x = a.offset().left - 80;
            var y = a.offset().top + 4;
            $(".html", tooltip).html(a.data("tooltiptext"));
            tooltip.css({ left: x, top: y })
                   .addClass("grayTooltip")
                   .removeClass("small")
                   .show();
        },
        function() {
            $("#leftTooltip").removeClass("small")
                               .hide();
        }
    );
	
	/***  various tooltips */
	$("#stepBar a[data-tooltiptext]").hover(
		function(e) {
			var a = $(this);
			var x = a.offset().left - a.width()/2 + 3;
			var y = a.offset().top + a.height() + 6;
			var tooltip = $("#bottomTooltip");
			$(".arrow", tooltip).css("left", 10);
			$(".html", tooltip).html(a.data("tooltiptext"));
			tooltip.css({ left: x, top: y })
				   .addClass("small")
				   .show();
		},
		function() {
			$("#bottomTooltip").removeClass("small")
							   .hide();
		}
	);
	
	/* end of general */
	
	/* alert modal */
	$("#alertModal .grayBtn").live("click", function() {
		return false;
	});
	/* end of alert modal */

    $('#hraModal .orangeBtn').click(function(){
        closeModal();
    })

    if( bodyId === 'loginPage' ) {
        (function() {
        })();
    }

	/* #mixlistPage */
	if( bodyId === "mixlistPage" ) {
		(function() {

        if($("#meizhe2012Modal").length > 0) {
            loadModal("#meizhe2012Modal");
            $("#meizhe2012Modal .block .note").css("opacity", 0.6);
            $("#meizhe2012Modal .pages a").click(function() {
                var a = $(this);
                var t = a.attr("rel");
                a.parent().find("a").removeClass("active");
                a.addClass("active");
                $("#meizhe2012Modal .block").hide().eq(+t).fadeIn(1200);
            });
            setInterval(function() {
                var t = +$("#meizhe2012Modal .pages a.active").attr("rel");
                t = (t+1)%4;
                $("#meizhe2012Modal .pages a[rel='"+t+"']").trigger("click");
            }, 5000);
        }

        var status = $("#tableFilterStatus").val();
        if(status === 'stopped' || status === 'deleted') {
            var trs = $(".act-tr");
            for(var i=0; i<10; i++) {
                trs.eq(i).show();
            }
            $("#moreActWrapper").show();
        }
        $("#moreActBtn").click(function() {
            $(".act-tr").show();
            $(this).parent().hide();
        });
        
		$(".searchBtn[data-tooltiptext]").hover(
			function(e) {
				var a = $(this);
				var x = $(window).width() - ( a.offset().left + a.width() ) - 12;
				var y = a.offset().top + a.height() + 2;
				var tooltip = $("#bottomTooltip");
				$(".html", tooltip).html(a.data("tooltiptext"));
				tooltip.css({ right: x, top: y })
					   .show();
			},
			function() {
				$("#bottomTooltip").hide();
			}
		);
        $(".search input.text").keyup(function(e) {
            if(e.keyCode === 13) $(".searchBtn").trigger("click");
        });
		$(".bigTable tr a[data-tooltiptext]").hover(
			function(e) {
				var a = $(this);
				var x = a.offset().left - 8;
				var y = $(window).height() - a.offset().top + 6;
				var tooltip = $("#topTooltip");
				$(".html", tooltip).html(a.data("tooltiptext"));
				tooltip.css({ left: x, bottom: y })
					   .show();
			},
			function() {
				$("#topTooltip").hide();
			}
		);
		
		/*** effect */
		$("td .buttons .more").hover(
			function() {
				var div = $(this);
				var submenu = $(".otherBtns", div);
				if(submenu.length > 0) {
					submenu.removeClass("reverse");
					
					var xplus = 20;
					//if(isIE8()) xplus = 10;
					
					var x = $(window).width() - ( div.parent().offset().left + div.parent().width() ) + xplus;
					var y = div.offset().top + div.height();
					if($(window).height() < y + submenu.height() + 20) {
						y = div.offset().top - submenu.height() - 1;
						submenu.addClass("reverse");
					}
					submenu.css({"right": x, "top": y})
						   .show();
				}
			},
			function() {
				var div = $(this);
				var submenu = $(".otherBtns", div);
                var subsubmenu = $(".otherOtherBtns", div);
				if(submenu.length > 0) {
					submenu.hide();
				}
                if(subsubmenu.length > 0) {
                    subsubmenu.hide();
                }
			}
		);
        var moremore_timeout = null;
        $("td .buttons .moreMore").hover(
            function() {
                clearTimeout(moremore_timeout);
                var div = $(this);
                var submenu = $(".otherOtherBtns", div);

                if(submenu.length > 0) {
                    var x = -div.width()-2;
                    var y = div.height()-1;
                    submenu.css({"left": x, "top": y})
                           .show();
                }
            },
            function() {
                var div = $(this);
                moremore_timeout = setTimeout(function() {
                    var submenu = $(".otherOtherBtns", div);
                    if(submenu.length > 0) {
                        submenu.hide();
                    }
                }, 300);
            }
        );

        /* search button */
        $(".searchBtn").click(function() {
            var a = $(this);
            a.text('搜索中...');
            var input = a.parent().find("input.text");
            var q = input.val();

            window.location.href = 'zhekou-edit-all?q=' + q;
        });
		
		/* finish act instant box */
		$(".finishBtn").click(function(e) {
			var btn = $(this);
			var box = $("#instantConfirmBox");
			var x = e.pageX - 105;
			var y = e.pageY - 75;
            box.data('action','finish');
            var act_id = getParent(btn, 'tr').find('.hidden_act_id').val();
            var act_type = getParent(btn, 'tr').find('.hidden_g_act_type').val();
            box.data('act_id',act_id);
            box.data('act_type',act_type);
            box.css({'left': x, "top": y})
               .show();
		});
        /* delete from list button */
        $(".removeFromListBtn").click(function(e) {
            var btn = $(this);
            var box = $("#instantConfirmBox");
            var x = e.pageX - 105;
            var y = e.pageY - 75;
            box.data('action','deleteFromList');
            box.find('.html').text('确定要永久删除该活动？');
            var act_id = getParent(btn, 'tr').find('.hidden_act_id').val();
            var act_type = getParent(btn, 'tr').find('.hidden_g_act_type').val();
            box.data('act_id',act_id);
            box.data('act_type',act_type);
            box.css({'left': x, "top": y})
               .show();
        });
		$("#instantConfirmBox .cancel").click(function() {
			$("#instantConfirmBox").hide();
		});

        $("#instantConfirmBox .confirm").click(function() {
            var box = $("#instantConfirmBox");
            var id = box.data('act_id');
            var act_type = box.data('act_type');
            if (box.data('action') === 'finish') {

                var stoplink = $(".tabs a[href='index-stopped']");
                var x = stoplink.offset().left;
                var y = stoplink.offset().top;

                $.post(act_type+'-delete',{'id':id},function(ret){
                    var tr = $("#tr-"+id);
                    var title = $(".title .text", tr);
                    stoplink.addClass("processing");
                    title.css({
                        position: 'absolute',
                        left: title.offset().left,
                        top: title.offset().top
                    }).animate({
                        left: x,
                        top: y,
                        width: '100px'
                    }, "slow", function() {
                        stoplink.removeClass("processing");
                    });
                    tr.animate({
                        opacity: 0
                    }, "slow", function() {
                        $(this).remove();
                        checkListLength();
                    });
                },'json');
            }
            else if(box.data('action') === 'deleteFromList') {
                $.post('remove-'+id,{}, function(ret) {
                    if (ret.success){
                        var tr = $("#tr-"+id);
                        tr.animate({
                                       opacity: 0
                                   }, "slow", function() {
                            $(this).remove();
                            checkListLength();
                        });
                    }else{
                        alert(ret.msg);
                    }
                });
            }
            $("#instantConfirmBox").hide();
        });


		/* edit act modal */
		$(".editActBtn").click(function() {
            var act_tr = getParent($(this), '.act-tr');
            var modal = $('#editActModal');

            $('.act_name',modal).val($('.hidden_name',act_tr).val());
            $('.act_started',modal).text($('.hidden_started',act_tr).val());
            $('.act_ended',modal).val($('.hidden_ended',act_tr).val());
            $(".act_fd_value",modal).val(+$('.fd_value',act_tr).val()/100);
            modal.data("aid", $(".hidden_act_id", act_tr).val());
            var act_type = $(".hidden_f_act_type", act_tr).val();
            modal.data("act_type", act_type);
            var title = $('.hidden_title',act_tr).val()
            $('#title',modal).empty();
            $('#title',modal).append($('<option value='+title+'>'+title+'</option>'));
            $('#title',modal).append($('<option value="-1">-- 自定义 --</option>'));
            $('#editActModal .formLine').jqTransSelectRemove($("#title"));
            $("#editActModal .formLine").jqTransform();
            if(act_type === 'fzhekou') {
                $("#editActModal .fzhekouLine").show();
            }
            else {
                $("#editActModal .fzhekouLine").hide();
            }
            loadModal("#editActModal");
		});
		$("#editActModal .submitBtn").click(function() {
			var modal = $("#editActModal");
			var data = {};
			data['name'] = $('.act_name',modal).val();
			data['ended'] = $('.act_ended',modal).val();

            var title = $('#title').val();
            if(title == -1) {
            	title = $("#custom_title").val();
            }
            data['title'] = title;
            data['aid'] = modal.data("aid");
            if(modal.data("act_type") === 'fzhekou') {
                data['fd_value'] = Math.round($(".act_fd_value", modal).val()*100);
            }

            $.post('zhekou-edit-info', data, function(res) {
            	if(!res.success) {
                    if (res.code == -37){
                        closeModal();
                        loadModal("#hraModal");
                    }else{
                        alert(res.msg);
                    }
            	}
            	else {
            		closeModal();
            		$("#alertModal .title").html("修改活动信息");
            		$("#alertModal .html").text("修改成功");
            		loadModal("#alertModal");
            		$("#alertModal").data("refreshPage", true);
            	}
            },'json');
		});
        $('#hraModal .orangeBtn').live("click", function() {
            loadModal("#editActModal");
        });
		$("#alertModal .closeModal").click(function() {
			if($("#alertModal").data("refreshPage")) {
				window.location.href = window.location.href;
			}
		});
        $("#editActModal .formLine").jqTransform();
        $("#title").change(function(){
            if ($("#title").val() === "-1"){
                $('#custom_title').show();
            }else{
                $('#custom_title').hide();
            }
        });
        $('#end_time').datetimepicker();
        
        
        var checkListLength = function() {
        	var len = $(".bigTable table tr").length;
        	if(len === 0) {
        		$(".grayMessage").show();
        		$(".appendButtons").hide();
        	}
        	else {
        		$(".grayMessage").hide();
        		$(".appendButtons").show();
        	}
        }
        
        checkListLength();

        $(".shareBtn").click(function() {
            var act_tr = getParent($(this), '.act-tr');
            var aid = $(".hidden_act_id", act_tr).val();
            $.post('weibo-'+aid, function(res) {
                if(res.success) {
                    var weibo = res.weibo;
                    weibo.msg = weibo.msg + ' #美折#';
                    var title = $('.hidden_name', act_tr).val();
                    var modal = $("#shareActModal");
                    $(".title span", modal).text(title);
                    $("textarea", modal).val(weibo.msg);
                    updateJiathisConfig(weibo);
                    loadModal("#shareActModal");
                }
                else {
                    alert(res.msg);
                }
            }, 'json');
        });

        
		})();
	}
	/* end of #mixlistPage */
	
	
	/* act step1 */
	if( bodyId === "actStep1Page" || bodyId === "mjsStep1Page") {
		(function() {

        var pagetype;
        if (bodyId === "mjsStep1Page") pagetype = 'mjs';
        else pagetype = 'zhekou';

        if(bodyId === 'actStep1Page') {
            if($("#zuidizhekouModal").length > 0) {
                $("#zuidizhekouModal input.checkbox").click(function() {
                    var checkbox = $(this);
                    if(checkbox.prop("checked")) {
                        $("#zuidizhekouModal .buttonLine").show();
                    }
                    else {
                        $("#zuidizhekouModal .buttonLine").hide();
                    }
                });
                loadModal("#zuidizhekouModal");
            }
        }


        $(".formLine").jqTransform();

        $("#title").change(function(){
            if ($("#title").val() === "-1"){
                $('#custom_title').show();
            }else{
                $('#custom_title').hide();
            }
            checkCustomTitle();
        });

        $("#buy_limit").change(function() {
            if ($("#buy_limit").val() === "-1"){
                $('#custom_buy_limit').show();
            }else{
                $('#custom_buy_limit').hide();
            }
            checkCustomBuyLimit();
        });

        function updateTimeDiff() {

            var start  = $('#start_time').datepicker('getDate');
            var end  = $('#end_time').datepicker('getDate');
            var diff = end.getTime()-start.getTime();
            var parents = $("#end_time").parentsUntil(".formLine");
            var $input = $(parents[parents.length-1]).parent().find(".hint");
            
            diff = (diff-diff%60000)/60000;
            var t = diff%60;
            $("em:eq(2)", $input).text(t);
            diff = (diff-t)/60;
            t = diff%24;
            $("em:eq(1)", $input).text(t);
            diff = (diff-t)/24;
            $("em:eq(0)", $input).text(diff);
            $("#end_time").parentsUntil(".formLine").parent().find(".okMsg").show();
            $("#end_time").parentsUntil(".formLine").parent().find(".errorMsg").hide();
        }
        $("#start_time").datetimepicker({
            minDate: new Date(),
            onClose: function(input, inst) {
                var mindate = $('#start_time').datepicker('getDate');
                var dateString = Date.parse($("#end_time").val().replace(/-/g, "/"));
                var enddate = new Date(dateString);
                $('#end_time').datetimepicker('destroy');
                $('#end_time').datetimepicker({
                    minDate: mindate,
                    onClose: function(input, inst) {
                        updateTimeDiff();
                    }
                });

                var day = mindate.getTime()-mindate.getTime()%(1000*60*60*24)+7*1000*60*60*24-(1000*60*60*6) + Math.floor(Math.random()*60*60*4*1000);
                mindate.setTime(day);
                if( mindate.getTime() > enddate.getTime() ) {
                    $('#end_time').datetimepicker('setDate', mindate);
                }
                updateTimeDiff();
                checkTime();
            }
        });
        $('#end_time').datetimepicker({
            onClose: function(input, inst) {
                updateTimeDiff();
                checkTime();
            }
        });

        
        // validate functions
        var addAppendError = function(line, text) {
        	var append = $(".append", line);
        	append.text(text)
        		  .addClass("error");
        }
        var removeAppendError = function(line) {
        	var append = $(".append", line);
        	append.text(append.data("normal"))
        		  .removeClass("error");
        }
        var checkName = function() {
        	var input = $("#name");
        	var val = $.trim(input.val());
        	if(val.length < 2 || val.length > 30) {
        		var text = '2到30个汉字(现在长度:' + val.length + ')';
        		input.addClass("error");
        		addAppendError(input.parent(), text);
        	}
        	else {
        		input.removeClass("error");
        		removeAppendError(input.parent());
        	}
        }
        var checkCustomTitle = function() {
            var input = $("#custom_title");
            if(!input.is(":visible")) {
                input.removeClass("error");
                removeAppendError(input.parent().parent());
                return false;
            }

            var val = $.trim(input.val());
            if(val.length < 2 || val.length > 5) {
                var text = '2到5个汉字(现在长度:' + val.length + ')';
                input.addClass("error");
                addAppendError(input.parent().parent(), text);
            }
            else {
                input.removeClass("error");
                removeAppendError(input.parent().parent());
            }
        }
        var checkCustomBuyLimit = function() {
            var input = $("#custom_buy_limit");
            if(!input.is(":visible")) {
                input.removeClass("error");
                removeAppendError(input.parent().parent());
                return false;
            }

            var val = $.trim(input.val());
            if(isNaN(val) || +val < 1 || +val > 100 || Math.round(+val) !== +val) {
                var text = '请输入大于0小于100的整数';
                input.addClass("error");
                addAppendError(input.parent().parent(), text);
            }
            else {
                input.removeClass("error");
                removeAppendError(input.parent().parent());
            }
        }
        var checkTime = function() {
        	var sdate = parseDate($("#start_time").val()+":00");
        	var edate = parseDate($("#end_time").val()+":00");

    		var input = $("#start_time");
        	if(!sdate || isNaN(sdate.getTime())) {
        		var text = '开始时间格式不正确';
        		input.addClass("error");
        		addAppendError(input.parent(), text);
        	}
        	else {
        		input.removeClass("error");
        		removeAppendError(input.parent());
        	}

    		var input = $("#end_time");
        	if(!edate || isNaN(edate.getTime())) {
        		var text = '结束时间格式不正确';
        		input.addClass("error");
        		addAppendError(input.parent(), text);
        	}
        	else if(edate.getTime() < sdate.getTime()) {
        		var text = '结束时间要大于开始时间';
        		input.addClass("error");
        		addAppendError(input.parent(), text);
        	}
        	else {
        		input.removeClass("error");
        		removeAppendError(input.parent());
        	}
        }
        var checkDiscount = function() {
            var input = $("#discount_full");
            var val = +$.trim(input.val());
            if(isNaN(val) || val < 0.1 || val >= 10) {
                var text = '折扣应是大于0小于10的数字';
                input.addClass("error");
                addAppendError(input.parent(), text);
            }
            else {
                input.removeClass("error");
                removeAppendError(input.parent());
            }
        }
        $("#name").keyup(function() {
        	checkName();
        });
        $("#discount_full").keyup(function() {
            checkDiscount();
        });
        $("#start_time").keyup(function() {
        	checkTime();
        });
        $("#end_time").keyup(function() {
        	checkTime();
        });
        $("#custom_title").keyup(function() {
            checkCustomTitle();
        });
        $("#custom_buy_limit").keyup(function() {
            checkCustomBuyLimit();
        });

        // initialize
        $(".append").each(function() {
            $(this).data("normal", $(this).text());
        });
        checkName();
        checkTime();
        updateTimeDiff();
        checkCustomTitle();
        checkCustomBuyLimit();
        if($('#discount_full').length>0) {
            checkDiscount();
        }

        // start request control
        $('.nextStepBtn').click(function() {
        	var data = {};
        	data['name'] = $('#name').val();
        	data['title'] = $('#title').val();
            if (data["title"] === "-1") data['title'] = $('#custom_title').val();
        	data['started'] = $('#start_time').val();
        	data['ended'] = $('#end_time').val();
        	data['scids'] = $('#scids').val();
        	data['tag'] = $('#tag').val();
            data['buy_limit'] = $("#buy_limit").val();
            if(data['buy_limit'] == -1) data['buy_limit'] = $("#custom_buy_limit").val();
            // validate
        	if($(".error").length > 0) {
        		alert("请先修正错误再提交");
        		return false;
        	}

            // full create check
            if ($('#discount_full').length>0){
                var btn = $('#nextStepBtn');
                if(btn.hasClass("grayBtn")) return false;

                var value = +$('#discount_full').val();
                data['fd_value'] = parseInt((value+0.00001)*100);
                if (!confirm('确认创建全店打'+value+"折活动?")){
                    return false;
                }
                // submit
                btn.data("text", btn.text())
                   .removeClass("greenBtn")
                   .addClass("grayBtn")
                   .text("正在提交...");
                $.post('zhekou-post-f', data, function(res){
                    if (res.success){
                        window.location.href='zhekou-4';
                    }else{
                        if (res.code == -37){
                            loadModal('#hraModal');
                        }else{
                            alert(res.msg);
                        }
                        btn.removeClass("grayBtn")
                           .addClass("greenBtn")
                           .text(btn.data("text"));
                    }
                },'json');
            }else{
                $.post(pagetype+'-post-1', data, function(res){
                    if (res.success){
                        window.location.href=pagetype+'-2';
                    }else{
                        alert(res.msg);
                    }
                },'json')
            }
            return false;
        });
        // end request control
		})();
	}
	/* end of act step1  */
	
	/* act step2 */
	if(bodyId === "actStep2Page" || bodyId === "addItemPage" 
        || bodyId === 'mjsStep2Page' || bodyId === 'mjsAddItemPage' || bodyId === 'postfeePage') {
		(function() {

	    var pagetype, search_url;
        if (bodyId === 'mjsStep2Page' || bodyId === 'mjsAddItemPage'){
            pagetype = 'mjs';
            if (bodyId === 'mjsAddItemPage') search_url = 'mjs-search-' + $('#hidden_act_id').val()
            else search_url = 'mjs-search'
        }
        else if (bodyId === "actStep2Page" || bodyId === "addItemPage"){
            pagetype = 'zhekou';
            search_url = 'zhekou-search'
        }else if (bodyId === 'postfeePage'){
            pagetype = 'postfee';
            search_url = 'postfee-search';
        }else{
            pagetype = 'zhekou';
            search_url = 'zhekou-search'
        }


		$(".selection a[data-tooltiptext]").hover(
			function(e) {
				var a = $(this);
				var x = a.offset().left + 22;
				var y = $(window).height() - a.offset().top + 6;
				var tooltip = $("#topTooltip");
                tooltip.stop(true, true);
				$(".html", tooltip).html(a.attr("data-tooltiptext"));
				tooltip.css({ left: x, bottom: y })
					   .show();
			},
			function() {
				$("#topTooltip").hide();
			}
		);
		
        // load selected ids first
		var selectedItems = [];
        var dirty = false;
        var hideDisabled = false;
        var hideDisabledCount = 0;
        var pageSize = 20;
        var orderBy = 'modified:desc';

        var currentActId = $('#hidden_act_id').val();


        var addToSelectedItems = function (id) {
            var existed = removeFromSelectedItems(id);
            selectedItems.push(id);
            checkLimited();
            return !existed;
        }

        var removeFromSelectedItems = function (id) {
            for (var i=0; i<selectedItems.length;i++){
                if (selectedItems[i] == id){
                    selectedItems.splice(i,1);
                    return true;
                }
            }
            return false;
        }

        var checkSelectItem = function(id){
            for (var i=selectedItems.length-1;i>=0;i--){
                if (id == selectedItems[i]) return true;
            }
            return false;
        }
        var checkLimited = function() {
            if(+$('#left_count').val() - selectedItems.length === 0) {
                $(".product:visible").not(".selected").not(".disabled").not(".disabled2").addClass("limited");
            }
        }

        var updateSelectCount = function(){
            $('.productsGrid .tabs .selectedTab .select_count').text(selectedItems.length);
            $('#left_show').text(+$('#left_count').val() - selectedItems.length);
            if(bodyId === 'postfeePage') $("#summary").trigger("change");
        }

		/* product grid control */
		$(".productsGrid .product").live({
            mouseenter: function() {
                if(!$(this).hasClass("disabled2") && !$(this).hasClass("disabled") && !$(this).hasClass("selected")&& !$(this).hasClass("limited")) {
                    $(this).addClass("hover");
                }
            },
            mouseleave: function() {
                $(this).removeClass("hover");
            }
        });
		$(".productsGrid .product a.image").live("click", function(e) {
			var p = $(this).parent();
			if(!p.hasClass("disabled2") && !p.hasClass("disabled") && !p.hasClass("limited") && !p.hasClass("virtual")) {
                p.toggleClass("selected");
                p.removeClass("hover");

                if (p.hasClass('selected')) {
	            	var tooltip = $("#topTooltip");
                    tooltip.stop(true,true);
	            	var x = e.pageX - 10;
                    var y = $(window).height() - e.pageY + 6;
					$(".html", tooltip).html("您还可以选择"+ (+$("#left_show").text()-1) + "件商品喔" );
					tooltip.css({ left: x, bottom: y })
						   .show()
						   .animate(
			                    {'bottom': y+100},
			                    3000,
			                    function() {
			                    	tooltip.hide();
			                    }
			                );
                }
				
                var item_id = +p.children('.num_iid').val();
                var change_ret = false;
                if (p.hasClass('selected')){
                    // add to list
                    change_ret = addToSelectedItems(item_id);
                }else{
                    // delete to list
                    change_ret = removeFromSelectedItems(item_id);
                    // select all button
                    $('.selectPageAll').removeClass('active_all').text('本页全选');
                }
                if (change_ret) dirty = true;
                updateSelectCount();
            }
		});
		/* end of product grid control */

        var appendProductItem_discount = function(item){
        	if(item.act_id && hideDisabled) {
        		hideDisabledCount++;
        		return false;
        	}
            if (item.is_virtual && hideDisabled){
                hideDisabledCount++;
                return false;
            }
            var p = $('.product.hidden-template').clone();
            p.removeClass('hidden-template')
            $('img', p).attr('src',item['pic_url']+'_180x180.jpg')
            $('.name', p).text(item.title);
            $('.name', p).attr('href','http://item.taobao.com/item.htm?id='+item.num_iid);
            $('.price', p).children('i').text(item.price);
            $('.num_iid', p).val(item.num_iid);
            $('.products').append(p);
            if (item.act_id){
                removeFromSelectedItems(item.num_iid);
                if (currentActId && item.act_id == currentActId)
                    p.addClass('disabled2');
                else
                    p.addClass('disabled');
            }else
            if (checkSelectItem(item.num_iid)) p.addClass('selected');
            else if (item.is_virtual) p.addClass('virtual');

            if(item.has_mjs_act) {
                $(".status_red", p).show()
            }
            else {
                $(".status_red", p).hide()
            }
        }


        var appendProductItem_postFee = function(item) {

            if(item.act_id && hideDisabled) {
                hideDisabledCount++;
                return false;
            }
            var p = $('.product.hidden-template').clone();
            p.removeClass('hidden-template')
            $('img', p).attr('src',item['pic_url']+'_180x180.jpg')
            $('.name', p).text(item.title);
            $('.name', p).attr('href','http://item.taobao.com/item.htm?id='+item.num_iid);

            $('.price', p).children('i').text(item.price);

            $('.num_iid', p).val(item.num_iid);
            $('.products').append(p);

            if(item.postage_id) {
                $('.status_gray',p).hide();
                $('.status_blue',p).text(postage_template[''+item.postage_id]).show();
            }
            else {
                $('.status_gray', p).text('快递'+item.express_fee+'元').show();
                $('.status_blue',p).hide();
            }

//            p.addClass('disabled2');
            if (checkSelectItem(item.num_iid)) p.addClass('selected');
        }

        var appendProductItem = appendProductItem_discount;
        if(bodyId === 'postfeePage') appendProductItem = appendProductItem_postFee;


        var search = function() {
            $(".mainMsg").hide();
            $(".loading").show();
        	$('.products').children().remove();
        	
            var search_data = {}
            var storeCat = $('#selectStoreCategory').val();
            var taobaoCat = $('#selectTaobaoCategory').val();
            var page_no = $('.now:eq(0)').text();

            // type get
            if ($('.productsGrid .tabs .onSaleTab').hasClass('active')) type = 0;
            else type = 1;
            search_data['type'] = type;

            var q = '';
            if ($('#searchInput').hasClass('withoutDefault')){
                q = $('#searchInput').val();
                var id = getQueryString(q, 'id');
                if(id !== '') q = id;
                search_data['q'] = q;
            }

            if (storeCat) search_data['scids'] = storeCat;
            if (taobaoCat) search_data['cid'] = taobaoCat;
            search_data['page_no'] = page_no;
            search_data['order_by'] = orderBy;

            $.post(search_url,search_data,function(res) {
                if (!res.success) {
                    alert(res.msg);
                    $(".loading").hide();
                    return;
                }
            	hideDisabledCount = 0;
                var products = res.res;
                for (var i in products){
                    appendProductItem(products[i]);
                }
                $('.products').append($('<div class="clear"></div>'));

                // page no
                $('.paging span .now').text(res.page_no);
                $('.paging span .total').text(res.total_pages);
                // hide number
                if(hideDisabled) {
                	$(".hideDisabledProducts").text("显示不可选宝贝(已隐藏"+ hideDisabledCount +"件)")
                							  .attr("data-tooltiptext", "显示本页已经参加其他活动的宝贝")
                }
                else {
                	$(".hideDisabledProducts").text("隐藏不可选宝贝")
                							  .attr("data-tooltiptext", "隐藏本页已经参加其他活动的宝贝");
                }

                $(".loading").hide();
                if(hideDisabledCount === pageSize) {
                    $(".noItem").show();
                }
                else if(products.length === 0) {
                    $(".noItem2").show();
                }

                // select all
                $('.selectPageAll').removeClass('active_all').text('本页全选');

                checkLimited();


            },'json');
        }

        $('#selectStoreCategory').change(function(){
            $('#selectTaobaoCategory option:eq(0)').prop('selected',true);
            $('#searchInput').removeClass('withoutDefault').addClass('default').val('关键字、商品链接、商品编码');
            $('.paging span .now').text(1);
            search();
        });

        $('#selectTaobaoCategory').change(function(){
            $('#selectStoreCategory option:eq(0)').prop('selected',true);
            $('#searchInput').removeClass('withoutDefault').addClass('default').val('关键字、商品链接、商品编码');
            $('.paging span .now').text(1);
            search();
        });
        $('.nextPage,.prevPage').click(function(){
            var page_no = +$('.now:eq(0)').text();
            var total_page = +$('.total:eq(0)').text();
            if ($(this).hasClass('prevPage')) page_no--;
            else page_no++;
            if (page_no == 0){
                alert('您已经在第一页了!');
                return;
            }else if (page_no> total_page){
                alert('您已经在最后一页了!');
                return;
            }
            $('.now').text(page_no);
            search()
        });
        $('.searchBtn').click(function(){
            $('#selectTaobaoCategory option:eq(0)').prop('selected',true);
            $('#selectStoreCategory option:eq(0)').prop('selected',true);
            $('.paging span .now').text(1);
            search();
        });
        $(".toSomePageBtn").click(function() {
            var total_page = +$('.total:eq(0)').text();
            var page_no = +$(".toSomePage:eq(0)").val();
            if(isNaN(page_no) || page_no % 1 !== 0) {
                alert('页码无效');
            }
            else if(page_no <= 0 || page_no > total_page) {
                alert('页码要在1到'+total_page+'之间');
            }
            else {
                $(".now").text(page_no);
                search();
            }
        });
        $(".toSomePage").keyup(function(e) {
            if(e.keyCode === 13) { // 回车
                $("a.toSomePageBtn", $(this).parent()).trigger("click");
            }
        });

        $('.nextBtn').click(function() {
        	if(selectedItems.length === 0) {
        		alert("您还没有选择任何商品");
        		return false;
        	}
            if(bodyId === 'mjsStep2Page' && selectedItems.length < 2) {
                alert("满就送 至少需要选择 2 件商品");
                return false;
            }
            var next_url = $(this).attr('href');
            if(bodyId === 'addItemPage') {
                next_url += '?fr=additem';
            }
            if(bodyId === 'mjsAddItemPage') next_url = 'mjs-edit-ok';
            $.post(pagetype+'-post-2',{'ids':selectedItems.join(',')},function(res){
                if (res.success){
                    if (bodyId === 'mjsAddItemPage') {

                        $.post(window.location,{'t':Math.random()},function(res){
                            if (!res.success){
                                if (res.code == -37){
                                    loadModal('#hraModal')
                                }else{
                                    alert(res.msg);
                                }
                            }else{
                                window.location.href = next_url
                            }
                        },'json');
                        
                    } else {
                        window.location.href = next_url
                    }
                } else {
                    alert(res.msg);
                }
            },'json')
            return false;
        });

        /* submit for postfee page */
        $("#postfeeBlock .filter .tabs a").click(function() {
            var a = $(this);
            var links = $("a", a.parent());
            links.removeClass("active");
            a.addClass("active");
            $("#postfeeBlock .tmpls").hide().eq(links.index(a)).show();
            $("#summary").trigger("change");
        });
        $("#postfeeBlock .tmpl").click(function() {
            $("#postfeeBlock .tmpl").removeClass("active");
            $(this).addClass("active");
            $("#summary").trigger("change");
        });
        $(".updatePostfeeBtn").click(function() {
            if(selectedItems.length === 0) {
                alert("您还没有选择任何商品");
                return false;
            }
            var type = $("#postfeeBlock .filter a.active");
            type = $("#postfeeBlock .filter a").index(type);
            var data = {};
            if(type === 0) {
                if($("#postfeeBlock .tmpls a.active").length === 0) {
                    alert("您还没有选择邮费模版");
                    return false;
                }
                data['postage_id'] = +$("#postfeeBlock .tmpls").eq(0).find("a.active").attr("id").substr("5");
            }
            else if(type === 1) {
                if($("#postfeeBlock .tmpls input.error").length > 0) {
                    alert("请先修正邮费错误再提交");
                    return false;
                }
                data['postage_id'] = 0;
                data['post_fee'] = +$("#post_fee_input").val();
                data['express_fee'] = $("#express_fee_input").val();
                data['ems_fee'] = $("#ems_fee_input").val();
            }
            $.post('postfee-create', data, function(res) {
                if(res.success) {
                    window.location.href = 'postfee-info';
                }
                else {
                    alert(res.msg);
                }
            }, 'json');
        });
        $("#postfeeBlock .formTmpls input.text").keyup(function() {
            var input = $(this);
            var val = input.val();
            if(isNaN(val)) input.addClass("error");
            else input.removeClass("error");
            $("#summary").trigger("change");
        });
        $("#summary").bind("change", function() {
            var summary = $(this);
            var count = $(".productsGrid .select_count").text();
            $("strong", summary).eq(0).html(count);
            var type = $("#postfeeBlock .filter a.active");
            type = $("#postfeeBlock .filter a").index(type);
            $(".tmplText", summary).hide();
            if(type === 0) {
                var tmpl = $("#postfeeBlock .tmpls").eq(0).find("a.active").text();
                $(".tmplText", summary).eq(0).find("strong").text(tmpl);    
            }
            else if(type === 1) {
                var span = $(".tmplText", summary).eq(1);
                $('.post_fee_span', span).text($("#post_fee_input").val());
                $('.express_fee_span', span).text($("#express_fee_input").val());
                $('.ems_fee_span', span).text($("#ems_fee_input").val());
            }
            $(".tmplText", summary).eq(type).show();
        });
        /* end of submit for postfee page */


        var submit_iids = function() {
            if(dirty){
                $.post(pagetype+'-post-2',{'ids':selectedItems.join(',')},function(res){
                    dirty = false;
                },'json')
            }
        }

        var clearSearchArgs = function(){
            $('#selectTaobaoCategory option:eq(0)').prop('selected',true);
            $('#selectStoreCategory option:eq(0)').prop('selected',true);
            $('#searchInput').removeClass('withoutDefault').addClass('default').val('关键字、商品链接、商品编码');
            $('.paging span .now').text(1);
        }

        var loadSelected = function(page_no){
            $.post(pagetype+'-selected-detail',{page_no:page_no},function(res){
                $(".loading").hide();
                items = res.selected;
                for (var i=0;i<items.length;i++){
                    appendProductItem(items[i]);
                }
                if (!res.no_more){
                    loadSelected(page_no+1)
                }else{
                    $('.products').append($('<div class="clear"></div>'));
                }
            },'json')
        }

        $('.productsGrid .tabs .onSaleTab, .productsGrid .tabs .notOnSaleTab').click(function(){
            $('.productsGrid .tabs').children().removeClass('active');
            $(this).addClass('active');
            clearSearchArgs();
            search();
        });

        $('.productsGrid .tabs .selectedTab').click(function(){
            clearSearchArgs();
            $(".loading").show();
            $('.productsGrid .tabs').children().removeClass('active');
            $(this).addClass('active');
            $('.products').empty();
            loadSelected(1);
        });

        $.post(pagetype+'-selected',{'t': Math.random()},function(res) {
            selectedItems = res.selected;
            updateSelectCount();
            search();
            setInterval(submit_iids,3000);
        },'json');

        // select page all
        $('.selectPageAll').click(function() {
            if (!$(this).hasClass('active_all')) {
                $(this).text('取消全选');
                $('.products .product .num_iid').each(function(){
                    var p = $(this).parent();
                    if (!p.hasClass('selected') && !p.hasClass("disabled") && !p.hasClass("disabled2") && !p.hasClass("limited") && !p.hasClass("virtual")){
                        // add to list
                        p.addClass('selected')
                        addToSelectedItems($(this).val());
                    }
                })
            } else {
                $(this).text('本页全选');
                $('.products .product .num_iid').each(function(){
                    var p = $(this).parent();
                    if (p.hasClass('selected')){
                        // add to list
                        p.removeClass('selected')
                        removeFromSelectedItems($(this).val());
                    }
                })
            }
            dirty = true;
            updateSelectCount()
            $(this).toggleClass('active_all');
        });
        
        $(".hideDisabledProducts").click(function() {
        	var btn = $(this);
        	if(!hideDisabled) {
        		hideDisabled = true;
        		search();
        	}
        	else {
        		hideDisabled = false;
        		search();
        	}
        });

        $(".sort a").click(function() {
            var a = $(this);
            var name = a.data("name");
            if(a.hasClass("ascBtn")) { // active asc -> desc
                a.removeClass("ascBtn");
                orderBy = name + ":desc";
            }
            else if(a.hasClass("lightAscBtn")) { // inactive asc -> asc
                $("a", a.parent()).removeClass("grayBtn").removeClass("ascBtn").addClass("lightGrayBtn");
                a.removeClass("lightAscBtn").addClass("grayBtn").addClass("ascBtn");
                orderBy = name + ":asc";
            }
            else if(a.hasClass("grayBtn")) { // active desc -> asc
                a.addClass("ascBtn");
                orderBy = name + ":asc";
            }
            else if(a.hasClass("lightGrayBtn")) { // inactive desc -> desc
                $("a", a.parent()).removeClass("grayBtn").removeClass("ascBtn").addClass("lightGrayBtn");
                a.removeClass("lightGrayBtn").addClass("grayBtn");
                orderBy = name + ":desc";
            }
            search();
        });

        
		})();
	}
	/* end of act step2  */

	/* act step3 */
	if(bodyId === "actStep3Page" || bodyId === "editPage") {
		(function() {

		$(".productsDiscountTable [data-tooltiptext]").live({
			mouseenter: function(e) {
				var a = $(this);
				var x = e.pageX - 16;
				var y = $(window).height() - a.offset().top + 6;;
				var tooltip = $("#topTooltip");
				$(".arrow", tooltip).css("left", 10);
				$(".html", tooltip).html(a.attr("data-tooltiptext"));
				tooltip.css({ left: x, bottom: y })
					   .addClass("small")
					   .show();
			},
			mouseleave: function() {
				$("#topTooltip").removeClass("small")
								.hide();
			}
		});
		
		$("input.autoAdjust").live("keyup", function() {
			var input = $(this);
			if(input.val().length > 7) {
				input.addClass("small");
			}
			else if(input.val().length <= 5) {
				input.addClass("big");
			}
			else if(input.val().length <= 7) {
				input.removeClass("small")
					 .removeClass("big");
			}
			
		});
		
		$(".batchOperation input.text").focus(function() {
			$(this).parent().find(".buttons").show();
            $(".batchOperation").addClass("highlightLine");
		});
		$(".batchOperation .buttons a.cancel").click(function() {
			$(this).parent().hide();
            if($(".batchOperation .buttons:visible").length === 0) {
                $(".batchOperation").removeClass("highlightLine");
            }
		});
        $(".batchOperation .buttons a.confirm").click(function() {
            $(".batchOperation .buttons").hide();
            $(".batchOperation").removeClass("highlightLine");
        });


        var load_current_url = 'zhekou-current';
        if ($('#hidden_act_id').length > 0){
            load_current_url += '-' + $('#hidden_act_id').val();
        }

		
		/* PageViewModel */
		var PageViewModel = function() {
			
			var _this = this;
			
			/* 辅助函数 */
			this._getItems = function() {
				var items = [];
				var ret = [];
				$.ajax({
					url: load_current_url,
					type: 'post',
					async: false,
					dataType: 'json',
					success: function(res) {
						items = res.items
					}
				});
				for(var i=0,max=items.length; i<max; i++) {
					ret.push(new DiscountItemModelView(items[i]));
				}
				return ret;
			}
			/* end of 辅助函数 */
			
			
			/* 批量设置 */
			this.isDiscountValid = ko.observable(true);
            this.discountErrorMsg = ko.observable('');
			this.zhekouInput = ko.observable(10);
			this.jianjiaInput = ko.observable(0);
			
			this.doZhekou = function() {
				if(!_this.isDiscountValid()) return false; // invalid

				var items = _this.getDisplayItems();
				for(var i=0,max=items.length; i<max; i++) {
					var item = items[i];
					item.zhekouInput(_this.zhekouInput());
					item.discountType('D');
				}
			};
			this.doJianjia = function() {
				if(!_this.isDiscountValid()) return false; // invalid

				var items = _this.getDisplayItems();
				for(var i=0,max=items.length; i<max; i++) {
					var item = items[i];
					item.jianjiaInput(_this.jianjiaInput());
					item.discountType('P');
				}
			};
			this.doMoling = function() {

				var items = _this.getDisplayItems();
				for(var i=0,max=items.length; i<max; i++) {
					var item = items[i];
                    if(item.isMultiplePrice) continue;
					var zhehoujia = +item.zhehoujia();
					zhehoujia = parseFloat(Math.floor(zhehoujia));
					item.zhehoujiaInput(zhehoujia);
					item.discountType('P');
				}
			};
            this.doMolingFen = function() {
                var items = _this.getDisplayItems();
                for(var i=0,max=items.length; i<max; i++) {
                    var item = items[i];
                    if(item.isMultiplePrice) continue;
                    var zhehoujia = +item.zhehoujia();
                    zhehoujia = parseFloat(Math.floor(zhehoujia*10)/10);
                    item.zhehoujiaInput(zhehoujia);
                    item.discountType('P');
                }
            };


			this.displayType = ko.observable(0); // 3个tab 0:全部，1:搜索 , -1：出错宝贝
			
			$(".loading").hide();
			this.items = ko.observableArray(this._getItems());
			this.errorItems = ko.computed(function() {
				var items = _this.items();
				var ret = [];
				for(var i=0,max=items.length; i<max; i++) {
					var item = items[i];
					if(!item.isDiscountValid()) {
						ret.push(item);
					}
				}
				return ret;
			});

            this.removeItem = ko.computed({
                write: function(item){
                    // delete from the list
                    var is_new = item.is_new;
                    _this.isRemoving = true;
                    _this.items.remove(item);
                    if (is_new){
                        var ids = '';
                        var items = _this.items();
                        for(var i=0,max=items.length; i<max; i++) {
                            var itm = items[i];
                            if (itm.is_new){
                                ids += itm.num_iid + ',';
                            }
                        }
                        if(ids.length > 0) ids.substr(0, ids.length-1);
                        $.post('zhekou-post-2',{'ids': ids},function(res){
                        },'json');
                    }else{
                        $.post('zhekou-delete-item',{'id':item.num_iid},function(res){
                        },'json');
                    }
                },
                read: function(item){}
            });

			/* 搜索 */
			this.isSearching = ko.observable(false);
			this.searchInput = ko.observable('关键字、商品链接、商品编码');
			this.searchedItems = ko.computed(function() {
				var items = _this.items();
				var str = $.trim(_this.searchInput().toLowerCase());
				if(str === '') return []; // empty string
				var num_iid = getQueryString(str, 'id');
				var ret = [];
				for(var i=0,max=items.length; i<max; i++) {
					var item = items[i];
					if(item.title.toLowerCase().indexOf(str) !== -1) ret.push(item);
					else if(item.num_iid == str || item.num_iid == num_iid) ret.push(item);
					else if(typeof item.outer_id !== "undefined" && item.outer_id.toLowerCase() == str) ret.push(item);
				}
				return ret;
			}).extend({throttle: 50});

            this.oldItems = ko.computed(function(){
                var items = _this.items();
                var ret = [];
                for(var i=0,max=items.length; i<max; i++) {
                    var item = items[i];
                    if(!item['is_new']) {
                        ret.push(item);
                    }
                }
                return ret;
            });

            this.newAddedItems = ko.computed(function(){
                var items = _this.items();
                var ret = [];
                for(var i=items.length-1; i>=0; i--) {
                    var item = items[i];
                    if(item['is_new']) {
                        ret.push(item);
                    }
                }
                return ret;
            });

			ko.computed(function() {
				var str = $.trim(_this.searchInput());
				if(str !== '' && str !== '关键字、商品链接、商品编码') {
					_this.isSearching(true);
					_this.displayType(1);
				}
				else _this.isSearching(false);
			}).extend({throttle: 100});


			this.getDisplayItems = ko.computed(function() {
				var type = _this.displayType();
				
				var ret = [];
				if(type === 0) ret = _this.items();
				else if(type === 1) ret = _this.searchedItems();
				else if(type === -1) ret = _this.errorItems();
                else if(type === 2) ret = _this.newAddedItems();
                else if(type === 3) ret = _this.oldItems();

				return ret;
			}).extend({throttle: 10});

			/* 分页 */
			this.pageSize = 10;
			this.nowPage = ko.observable(1);
			this.totalPage = ko.computed(function() {
				var items = _this.getDisplayItems();
				var size = _this.pageSize;
				
				var tot = items.length;
				
				var max = Math.floor((tot+0.5)/size);
                if(tot%size != 0) {
                    max++;
                }
                return max;
			});
			this.toPrevPage = function() {
				var a = _this.nowPage();
				if(a > 1) _this.nowPage(a-1);
				else return false;
			};
			this.toNextPage = function() {
				var a = _this.nowPage();
				if(a < _this.totalPage()) _this.nowPage(a+1);
				else return false;
			};
			this.toSomePage = function() {
				var val = $(".toSomePage:eq(0)").val();
				if(val && val > 0 && val <= _this.totalPage()) _this.nowPage(+val);
				else alert("输入错误，页码不存在");
			}
			
			this.displayProducts = ko.computed(function() {

				var ret = _this.getDisplayItems();

                var start = _this.pageSize * (_this.nowPage()-1);
                var end = Math.min(ret.length, start + _this.pageSize);

                return ret.slice(start, end);
			}).extend({throttle: 10});
			
			// remove item
			this.isRemoving = false;
			this.hideItem = function(elem) {
				if(elem.nodeType === 1 && _this.isRemoving) { // 删除某个宝贝 
					_this.isRemoving = false;
					$(elem).animate({
	                    opacity: 0,
	                    height: 0
	                }, "slow", function() {
	                    $(this).remove();
	                });
				}
				else if(elem.nodeType === 1) { // 正常的tab切换
					$(elem).remove();
				}
			}
			
			this.generateDiscountData = function() {
				var items = _this.items();
				var ret = {};
				for(var i=0,max=items.length; i<max; i++) {
					var item = items[i];
                    item.dirty(false);
                    if (!item.isChanged()) continue;
					ret[+item.num_iid] = {};
					ret[+item.num_iid]['d_type'] = item.discountType();
                    ret[+item.num_iid]['d_value'] = item.discountValue();
				}
				return ret;
			}
		};
		/* end of PageViewModel */
		var pageModelView = new PageViewModel();
		ko.applyBindings(pageModelView);
        var link = window.location.href;
        var from = getQueryString(link, 'fr');
        if(from === 'additem') {
            pageModelView.displayType(2);
        }
        var num_iid = getQueryString(link, 'num_iid');
        if(num_iid !== '') {
            pageModelView.searchInput(num_iid);
        }
		
		setInterval(function() {
            var dirty = false;
            var items = pageModelView.items();
            for(var i=0,max=items.length; i<max; i++) {
                if(items[i].dirty()) {
                    dirty = true;
                    break;
                }
            }
			if(dirty) {
				var data = pageModelView.generateDiscountData();
				var data = JSON.stringify(data);
				$.post('zhekou-post-3', {'data':data}, function(res) {
					dirty = false;
	            },'json');
			}
		}, 6000);
		
		$("#nextStepBtn").click(function() {
            var btn = $(this);

			var errlen = pageModelView.errorItems().length;
			if(errlen > 0) alert("您有" + errlen + "件商品折扣有误，请修正后提交");
			else{
                var data = pageModelView.generateDiscountData();
                var data = JSON.stringify(data);
                if(data.length < 3) {
                    var text = "您没有为商品设置折扣，请设置后提交";
                    if(bodyId === 'editPage') text = "您没有修改商品折扣，请修改后提交";
                    alert(text);
                    return false;
                }

                if(btn.hasClass("grayBtn")) return false;
                // submit
                btn.data("text", btn.text())
                   .removeClass("greenBtn")
                   .addClass("grayBtn")
                   .text("正在提交...");

                $.post('zhekou-post-3', {'data':data}, function(postres) { // 最后再提交一次
                    $.post('zhekou-create', {'t': Math.random()}, function(res) { // 提交完毕以后创建活动
                        if (res.success){
                            var url = 'zhekou-4';
                            if(bodyId === 'editPage') url = 'zhekou-edit-ok';
                            url = url + '?t='+Math.random();
                            window.location.href = url;
                        }else{
//                            alert(res.msg)
                            if (res.code == -37) {
                                // no hra, please do hra now
                                loadModal('#hraModal')
                            }else{
                                alert(res.msg);
                            }
                            btn.removeClass("grayBtn")
                               .addClass("greenBtn")
                               .text(btn.data("text"));
                        }
                    },'json');
                },'json');
            }
            return false;
		});

        $(".batchOperation .batch input.text").keyup(function(e) {
            if(e.keyCode === 13) { // 回车
                $("a.confirm", $(this).parent()).trigger("click");
            }
        });
        $(".toSomePage").keyup(function(e) {
            if(e.keyCode === 13) { // 回车
                $("a.toSomePageBtn", $(this).parent()).trigger("click");
            }
        });
        $(".product .discount input.text").live("keyup", function(e) {
            if(e.keyCode == 13) {
                var input = $(this);
                var product = getParent($(this), '.product');
                var idx = $(".discount input.text", product).index(input);
                if(product.next().hasClass("product")) {
                    $(".discount input.text", product.next()).eq(idx).focus();
                }
            }
        });

		})();
	}
	/* end of act step3  */

    /* edit all page */
    if(bodyId === 'editAllPage') {
        (function() {

        $(".productsDiscountTable [data-tooltiptext]").live({
            mouseenter: function(e) {
                var a = $(this);
                var x = e.pageX - 16;
                var y = $(window).height() - a.offset().top + 6;;
                var tooltip = $("#topTooltip");
                $(".arrow", tooltip).css("left", 10);
                $(".html", tooltip).html(a.attr("data-tooltiptext"));
                tooltip.css({ left: x, bottom: y })
                       .addClass("small")
                       .show();
            },
            mouseleave: function() {
                $("#topTooltip").removeClass("small")
                                .hide();
            }
        });

        /* PageModelView */
        var PageModelView = function() {
            var _this = this;

            this.items = ko.observableArray();

            this.removeItem = ko.computed({
                write: function(item){
                    // delete from the list
                    _this.isRemoving = true;
                    _this.items.remove(item);
                    $.post('zhekou-delete-item',{'id':item.num_iid},function(res) {
                    },'json');
                },
                read: function(item){}
            });
            // remove item
            this.isRemoving = false;
            this.hideItem = function(elem) {
                if(elem.nodeType === 1 && _this.isRemoving) { // 删除某个宝贝 
                    _this.isRemoving = false;
                    $(elem).animate({
                        opacity: 0,
                        height: 0
                    }, "slow", function() {
                        $(this).remove();
                    });
                }
                else if(elem.nodeType === 1) { // 正常的tab切换
                    $(elem).remove();
                }
            }

            this.searchInput = ko.observable('关键字、商品链接、商品编码');
            this.isSearching = ko.observable(false);

            this.search = function() {
                var q = $.trim(_this.searchInput());
                if(q === '') {
                    alert('关键词不能为空');
                    return false;
                }

                _this.items([]);
                _this.isSearching(true);
                $.post('zhekou-search', {q: q, page_size:200, request_more: 1}, function(res) {
                    
                    _this.isSearching(false);
                    if(!res.success) {
                        alert(res.msg);
                        return false;
                    }

                    var items = [];
                    var products = res.res;
                    for(var i=0,max=products.length; i<max; i++) {
                        var product = products[i];
                        if(!product.act_id) continue; // 只显示打折商品
                        var mv = new DiscountItemModelView(product);
                        mv.act_id = product.act_id;
                        mv.dirty(false);
                        mv.submitStatus = ko.observable(0); // 0:未提交, 1:正在提交 2:提交成功
                        mv.submitText = ko.computed(function() {
                            if(this.submitStatus() === 1) return '提交中';
                            else if(this.submitStatus() === 2) return '提交成功';
                            else return '提交修改';
                        }, mv);
                        mv.submitError = ko.observable(false);
                        items.push( mv );

                    }

                    _this.items(items);

                });
            }

            this.submit = function(item) {

                if(!item.isDiscountValid()) {
                    item.submitError(item.discountErrorMsg() + '，请修正后再提交');
                    return false;
                }

                item.submitStatus(1);

                ret = {};
                ret[+item.num_iid] = {};
                ret['id'] = +item.num_iid;
                ret['d_type'] = item.discountType();
                ret['d_value'] = item.discountValue();

                $.post('zhekou-update-item', ret, function(res) {
                    if(!res.success) {
                        item.submitStatus(0);
                        if(res.code === -37) {
                            loadModal('#hraModal');
                        }
                        else {
                            item.submitError(res.msg);
                        }
                    }
                    else { // success
                        item.submitError('');
                        item.submitStatus(2);
                        setTimeout(function() {
                            item.submitStatus(0);
                            item.dirty(false);
                        }, 1500);
                    }
                });
            }

        }
        /* end of PageModelView */

        var pageModelView = new PageModelView();
        var q = getQueryString(location.href, 'q');
        if(q !== '') {
            pageModelView.searchInput(q);
            pageModelView.search();
        }
        ko.applyBindings(pageModelView);
        $(".search input.text").keyup(function(e) {
            if(e.keyCode === 13) $(".searchBtn").trigger("click");
        });


        })();
    }
    /* end of edit all page */

	
	/* act detail page */
	if(bodyId === "actDetailPage") {

        (function() {
		/* finish act */
		$(".finishBtn").click(function(e) {
			var btn = $(this);
			var box = $("#instantConfirmBox");
            box.data("act_id", $("dl.big").attr("id")).data("action", "finishAct");
            $(".html", box).text("您确定结束这个活动吗？");
			var x = e.pageX - 105;
			var y = e.pageY - 75;
			box.css({'left': x, "top": y})
			   .show();
		});
		/* edit act modal */
		$(".editActBtn").click(function() {
            var act_dl = $("dl.big");
            var modal = $('#editActModal');

            $('.act_name',modal).val( $(".name span", act_dl).text() );
            $('.act_started',modal).text( $(".started", act_dl).text() );
            $('.act_ended',modal).val( $(".ended", act_dl).text() );
            if($("#act_type").val() === 'fzhekou') $(".act_fzhekou").val( $(".fd_value").text() );

            modal.data("aid", act_dl.attr("id") );
            var title = $(".title", act_dl).text();
            $('#title',modal).empty();
            $('#title',modal).append($('<option value='+title+'>'+title+'</option>'));
            $('#title',modal).append($('<option value="-1">-- 自定义 --</option>'));
            $('#editActModal .formLine').jqTransSelectRemove($("#title"));
            $("#editActModal .formLine").jqTransform();
			loadModal("#editActModal");
		});
        $("#editActModal .formLine").jqTransform();
        $("#editActModal .submitBtn").click(function() {
            var modal = $("#editActModal");
            var data = {};
            data['name'] = $('.act_name',modal).val();
            data['ended'] = $('.act_ended',modal).val();
            var title = $('#title').val();
            if(title == -1) {
                title = $("#custom_title").val();
            }
            data['title'] = title;
            data['aid'] = modal.data("aid");
            $.post('zhekou-edit-info', data, function(res) {
                if(!res.success) {
                    if (res.code == -37){
                        closeModal();
                        loadModal("#hraModal");
                    }else{
                        alert(res.msg);
                    }
                }
                else {
                    closeModal();
                    $("#alertModal .title").html("修改活动信息");
                    $("#alertModal .html").text("修改成功");
                    loadModal("#alertModal");
                    $("#alertModal").data("refreshPage", true);
                }
            },'json');
        });
        $('#hraModal .greenBtn').live("click", function() {
            loadModal("#editActModal");
        });
        $("#alertModal .closeModal").click(function() {
            if($("#alertModal").data("refreshPage")) {
                window.location.href = window.location.href;
            }
        });
        $("#title").change(function(){
            if ($("#title").val() === "-1"){
                $('#custom_title').show();
            }else{
                $('#custom_title').hide();
            }
        });
        $('#end_time').datetimepicker();

        $(".shareBtn").click(function() {
            var act_dl = $("dl.big");
            var aid = act_dl.attr("id");
            $.post('weibo-'+aid, function(res) {
                if(res.success) {
                    var weibo = res.weibo;
                    weibo.msg = weibo.msg + ' #美折#';
                    var title = $('.name span', act_dl).text();
                    var modal = $("#shareActModal");
                    $(".title span", modal).text(title);
                    $("textarea", modal).val(weibo.msg);
                    updateJiathisConfig(weibo);
                    loadModal("#shareActModal");
                }
                else {
                    alert(res.msg);
                }
            }, 'json');
        });

        /* search product */
        $(".searchBtn, #searchProductsFilter").click(function() {
            $("#errorProducts").hide();
            $("#allProducts").show();
            $("#searchProductsFilter").show();
            var text = $(".search .text").val();
            text = $.trim(text).toLowerCase();
            var id = getQueryString(text, 'id');
            var cnt = 0;
            $("#allProducts .p").each(function() {
                var p = $(this);
                var a = $(".num_iid", p).val();
                var b = $(".outer_id", p).val();
                var c = $(".title", p).text();
                if(text == a || c.toLowerCase().indexOf(text) !== -1 || a == id) {
                    p.show();
                    cnt++;
                }
                else if(b !== '' && text == b) {
                    p.show();
                    cnt++;
                }
                else p.hide();
            });
            $(".detailProducts .category").hide();
            $("#allProducts").show();
            $(".detailProducts .tabs a").removeClass("active");
            $("#searchProductsFilter").addClass("active");
            $("#searchLength").text(cnt);
            if(cnt === 0) $(".noSearchResult").show();
            else $(".noSearchResult").hide();

            $(".filter .funcBtns a").hide();
            //$(".filter .deleteAllInstockBtn").show();
            $(".filter .search").show();
        });
        $(".search .text").keyup(function(event) {
            if(event.keyCode == 13) {
                $(".searchBtn").trigger("click");
            }
        });
        $("#allProductsFilter").click(function() {
            $(".detailProducts .category").hide();
            $("#allProducts").show();
            $(".detailProducts .tabs a").removeClass("active");
            $(this).addClass("active");
            $("#allProducts .p").show();
            $(".noSearchResult").hide();
            $(".filter .funcBtns a").hide();
            //$(".filter .deleteAllInstockBtn").show();
            $(".filter .search").show();
        });
        /* end of search product */

        /* handle parameter */
        var link = window.location.href;
        var id = getQueryString(link, 'num_iid');
        if(id !== '') {
            $(".search input.text").trigger("focus").val(id);
            $(".searchBtn").trigger("click");
            var href = $(".editProductsBtn").attr("href");
            href = setQueryString(href, 'num_iid', id);
            $(".editProductsBtn").attr("href", href);
        }
        /* end of handle paramter */

        /* delete product */
        $(".detailProducts .category .p").hover(
            function() {
                $(this).addClass("phover");
            },
            function() {
                $(this).removeClass("phover");
            }
        );
        $(".deleteProductBtn").click(function(e) {

            if($("#act_type").val() === 'mjs') {
                if($("#allProducts .p").length <= 2) {
                    alert("删除失败：满就送活动至少要有2件商品");
                    return false;
                }
            }

            var p = $(this).parent();
            var id = $(".num_iid", p).val();
            var box = $("#instantConfirmBox");
            box.data("num_iid", id).data("action", "deleteItem");
            $(".html", box).text("您确定从活动中删除这个商品吗？");
            var x = e.pageX - 105;
            var y = e.pageY - 75;
            box.css({'left': x, "top": y})
                .show();
        });
        /* end of delete product */

        /* instance confirm box */
        $("#instantConfirmBox .cancel").click(function() {
            $("#instantConfirmBox").hide();
        });
        $("#instantConfirmBox .confirm").click(function() {
            var box = $("#instantConfirmBox");
            if (box.data('action') == 'finishAct'){
                var act_id = box.data('act_id');
                var act_type = $("#act_type").val();
                if (act_type === 'fzhekou') act_type = 'zhekou';
                if (act_type === 'fmjs' || act_type === 'dmjs') act_type = 'mjs';
                $.post(act_type+'-delete',{'id':act_id},function(ret){
                    if(ret.success === 1) {
                        window.location.href = window.location.href;
                    }
                },'json');
            }
            else if(box.data('action') === 'deleteItem') {
                var num_iid = box.data('num_iid');
                var p = $(".item-"+num_iid);
                var act_type = $("#act_type").val();
                var link = act_type + '-delete-item';
                var data = {};
                if(act_type === 'zhekou') {
                    data['id'] = num_iid;
                }
                else if(act_type === 'mjs') {
                    data['aid'] = $("dl.big").attr("id");
                    data['num_iid'] = num_iid;
                }
                $.post(link, data, function(res) {
                    p.animate({
                        opacity: 0,
                        height: 0
                    }, "slow", function() {
                        p.remove();
                        var allLen = $("#allProducts .p").length;
                        var errLen = $("#errorProducts .p").length;
                        var instockLen = $("#instockProducts .p").length;
                        $("#allLength").text(allLen);
                        $("#errorLength").text(errLen);
                        $("#intockLength").text(instockLen);
                        if(allLen === 0) $("#allProducts .noSearchResult").show();
                        if(instockLen === 0) {
                            $("#instockProducts .noInstockProduct").show();
                            $(".filter .deleteAllInstockBtn").remove();
                        }
                        if(errLen === 0) $("#errorProducts .noErrorProduct").show();
                        if($("#searchProductsFilter").hasClass("active")) {
                            $(".searchBtn").trigger("click");
                        }
                    });
                },'json');
            }
            $("#instantConfirmBox").hide();
        });
        /* end of instance confirm box */

        /* instock products */
        var instockLen = $("#instockProducts .p").length;
        if(instockLen > 0) {
            var filter = $("#intockLength").text(instockLen);
            $("#instockProductsFilter").show();
            $("#instockProductsFilter").click(function() {
                $(".detailProducts .category").hide();
                $("#instockProducts").show();
                $(".detailProducts .tabs a").removeClass("active");
                $(this).addClass("active");
                $(".filter .funcBtns a").hide();
                $(".filter .deleteAllInstockBtn").show();
                $(".filter .search").hide();
            });
        }
        /* end of instock products */

        /* error products */
        if($("#allProducts .perror").length > 0) {
            var adultCategories = {
                /* 50012829 */
                '50003114': true, '50012831': true, '50012832': true, '50012830': true, '50006275': true,
                /* 50019617 */
                '50019618': true, '50019619': true, '50019623': true, '50019626': true, '50019627': true,
                '50019628': true, '50019629': true,
                /* 50019630 */
                '50019631': true, '50019636': true, '50019637': true, '50019638': true, '50019639': true,
                '50019640': true,
                /* 50019641 */
                '50019642': true, '50019643': true, '50019644': true, '50019645': true, '50019646': true,
                '50019700': true, '50019647': true,
                /* 50019651 */
                '50019652': true, '50019653': true, '50019656': true, '50019657': true, '50019658': true,
                '50019659': true,
                /* 50020206 */
                '50020205': true, '50050327': true
            }

            $("#allProducts .perror span.errorSpan").each(function() {
                var span = $(this);
                var a = span.attr("title");
                var p = getParent(span, '.p');
                var id = $(".num_iid", p).val();

                if(adultCategories[$(".cid", p).val()]) { // 成人类目
                    span.attr('title', '成人类目商品，淘宝不允许工具插入满就送信息到宝贝详情页')
                        .removeClass('status_red')
                        .addClass('status_gray')
                        .text('成人类目商品');
                    p.removeClass('perror');
                    $("#errorProducts .item-"+id).remove();
                }
                else {
                    var idx = a.lastIndexOf('|');
                    span.attr("title", a.substr(idx+1));
                    p.addClass("perrorTrue");
                    $("#instockProducts .item-"+ id + " .errorSpan").attr("title", a.substr(idx+1)).show();
                }
                span.show();
                $("#instockProducts .item-"+id).addClass("perrorTrue");
            });
            $("#errorProducts .errorMsg").each(function() {
                var msg = $(this);
                var a = msg.text();
                var idx = a.lastIndexOf('|');
                msg.text(a.substr(idx+1));
            });

            $("#errorProductsFilter").click(function() {
                $(".detailProducts .category").hide();
                $("#errorProducts").show();
                $(".detailProducts .tabs a").removeClass("active");
                filter.addClass("active");
                $(".filter .funcBtns a").hide();
                //$(".filter .deleteAllInstockBtn").show();
                $(".filter .search").hide();
            });

            var filter = $("#errorProductsFilter");
            var errlen = $("#allProducts .perror").length;
            $("#errorLength", filter).text(errlen);
            if(errlen > 0) filter.show();
        }

        })();
	}
	/* end of act detail page */
	

	/* mjs step3 */
    if (bodyId === "mjsStep3Page") {

        (function () {

            // 地区编号对应表
            var Location = {
                '54':'西藏', '65':'新疆', '71':'台湾', '81':'香港', '82':'澳门', '31':'上海', '11':'北京', '12':'天津', '13':'河北', '37':'山东',
                '14':'山西', '15':'内蒙古', '21':'辽宁', '22':'吉林', '23':'黑龙江', '32':'江苏', '33':'浙江', '34':'安徽', '36':'江西', '41':'河南',
                '42':'湖北', '43':'湖南', '44':'广东', '45':'广西', '35':'福建', '46':'海南', '50':'重庆', '51':'四川', '52':'贵州', '53':'云南',
                '61':'陕西', '62':'甘肃', '63':'青海', '64':'宁夏'
            };
            var LocationArr = ['54', '65', '31', '11', '12', '13', '37', '14', '15', '21', '22', '23', '32', '33', '34', '36', '41', '42', '43', '44', '45', '35', '46', '50', '51', '52', '53', '61', '62', '63', '64'];

            $(".mjsSettings [data-tooltiptext]").live({
                 mouseenter:function (e) {
                     var a = $(this);
                     var x = e.pageX - 16;
                     var y = $(window).height() - a.offset().top + 6;
                     var tooltip = $("#topTooltip");
                     $(".arrow", tooltip).css("left", 10);
                     $(".html", tooltip).html(a.attr("data-tooltiptext"));
                     tooltip.css({ left:x, bottom:y })
                         .addClass("small")
                         .show();
                 },
                 mouseleave:function () {
                     $("#topTooltip").removeClass("small")
                         .hide();
                 }
            });

            var dirty = false;
            var DetailPageView = function (detail) {
                var _this = this;

                this.uidstr = Math.round(Math.random()*1000000000);
                /* 变量 */
                this.conditionType = ko.observable('Y');		// Y表示满多少元，J表示满多少件
                this.conditionYuan = ko.observable(100);		// 满XX元
                this.conditionJian = ko.observable(2);			// 满XX件
                this.conditionError = ko.observable(0);
                this.conditionFengding = ko.observable(true);

                this.conditionYuan.subscribe(function () {
                    _this.conditionError(0);
                    var val = _this.conditionYuan();
                    val = +val;
                    if (isNaN(val) || val <= 0) {
                        _this.conditionError(1);
                    }
                });
                this.conditionJian.subscribe(function () {
                    _this.conditionError(0);
                    var val = _this.conditionJian();
                    val = +val;
                    if (isNaN(val) || val <= 0) {
                        _this.conditionError(1);
                    }
                });
                this.conditionType.subscribe(function () {
                    _this.conditionError(0);
                    var t = _this.conditionType();
                    if (t === 'Y') {
                        var val = _this.conditionYuan();
                        val = +val;
                        if (isNaN(val) || val <= 0) {
                            _this.conditionError(1);
                        }
                    }
                    else if (t === 'J') {
                        var val = _this.conditionJian();
                        val = +val;
                        if (isNaN(val) || val <= 0) {
                            _this.conditionError(1);
                        }
                    }
                });

                this.detailType = ko.observable('P');		// P和D，优惠内容是 打折还是减价
                this.detailPrice = ko.observable(10);		// 减XX元
                this.detailDiscount = ko.observable(9);		// 打XX折
                this.isPostFree = ko.observable(false);		// 是否包邮
                this.isGiftName = ko.observable(false);
                this.theGiftName = ko.observable('礼物名称');
                this.theGiftUrl = ko.observable('');
                this.theGiftId = ko.observable('');

                this.detailError = ko.observable(0);

                this.detailPrice.subscribe(function () {
                    _this.detailError(0);
                    var val = _this.detailPrice();
                    val = +val;
                    if (isNaN(val) || val <= 0) {
                        _this.detailError(1);
                    }
                });
                this.detailDiscount.subscribe(function () {
                    _this.detailError(0);
                    var val = _this.detailDiscount();
                    val = +val;
                    if (isNaN(val) || val <= 0 || val >= 10) {
                        _this.detailError(1);
                    }
                });
                this.detailType.subscribe(function () {
                    _this.detailError(0);
                    var t = _this.detailType();
                    if (t === 'Y') {
                        var val = _this.detailPrice();
                        val = +val;
                        if (isNaN(val) || val <= 0) {
                            _this.detailError(1);
                        }
                    }
                    else if (t === 'J') {
                        var val = _this.detailDiscount();
                        val = +val;
                        if (isNaN(val) || val <= 0 || val >= 10) {
                            _this.detailError(1);
                        }
                    }
                });

                // 包邮地区，默认是全部包邮
                this.postFreeLocation = ko.observableArray(LocationArr.slice(0));
                this.postFreeLocationSaved = [];
                this.index = ko.observable(0);

                this.updateDetailType = function(a) {
                    var dt = _this.detailType();
                    if(dt === a) _this.detailType('');
                    else _this.detailType(a);
                }
                this.showDetailValue = function(tag_index) {
                    tag_index = +tag_index;
                    return ko.computed(function() {
                        var d = _this.detailType();
                        var cfd = _this.conditionFengding();
                        var ret = '';
                        if(d.length > 0) {
                            if(tag_index === 0) {
                                if(d === 'P') {
                                    ret = '减 <strong style="color:#FF5400;font-size:16px;">'+_this.detailPrice()+'</strong> 元';
                                    if (cfd == 1) ret = ret + "&nbsp;上不封顶"
                                }
                                else if(d === 'D') {
                                    ret = '打 <strong style="color:#FF5400;font-size:16px;">'+_this.detailDiscount()+'</strong> 折';
                                }
                            }
                            else if(tag_index === 1) {
                                if(d === 'P') {
                                    ret = '减 <strong style="color:#FF5400;font-size:20px;">'+_this.detailPrice()+'</strong> 元';
                                    if (cfd == 1) ret = ret + "&nbsp;&nbsp;<span style='color:#999'>上不封顶</span>"
                                }
                                else if(d === 'D') {
                                    ret = '打 <strong style="color:#FF5400;font-size:20px;">'+_this.detailDiscount()+'</strong> 折';
                                }
                            }
                        }
                        return ret;
                    }).extend({throttle: 50});
                }
                this.notPostFreeLocation = ko.computed(function () {
                    var ret = [];
                    var locs = _this.postFreeLocation();
                    for(var i=0, max=LocationArr.length; i<max; i++) {
                        var t = LocationArr[i];
                        var find = false;
                        for(var j=0,maxj=locs.length; j<maxj && !find; j++) {
                            if(locs[j] == t) {
                                find = true;
                            }
                        }
                        if(!find) ret.push(t);
                    }
                    return ret;
                }).extend({throttle: 50});
                this.postFreeLocToString = ko.computed(function () {
                    var str = '不免邮地区：';
                    var locs = _this.notPostFreeLocation();
                    if(_this.postFreeLocation().length < _this.notPostFreeLocation().length) {
                        locs = _this.postFreeLocation();
                        str = '免邮地区：';
                    }
                    for(var i=0,max=locs.length; i<max; i++) {
                        str += Location[+locs[i]] + ',';
                    }
                    str = str.substr(0, str.length-1);
                    return str;
                }).extend({throttle: 50});
                this.loadPostFreeLocModal = function () {
                    _this.postFreeLocationSaved = _this.postFreeLocation().slice(0);
                    _this.updatePfBigBtn();
                    loadModal("#postFreeLocModal");
                };
                this.cancelPostFreeLoc = function() {
                    _this.postFreeLocation(_this.postFreeLocationSaved.slice(0));
                };
                this.updatePostFreeLoc = function(data, event) {
                    var locs = _this.postFreeLocation();
                    var elem = $(event.target);
                    var arr =  elem.val().split(",");
                    var checked = elem.prop("checked");
                    if(checked) {
                        for(var i=0, max=arr.length; i<max; i++) {
                            var t = arr[i];
                            var find = false;
                            for(var j=0,maxj=locs.length; j<maxj && !find; j++) {
                                if(locs[j] == t) find = true;
                            }
                            if(!find) _this.postFreeLocation.push(t);
                        }
                    }
                    else {
                        for(var i=0, max=arr.length; i<max; i++) {
                            var t = arr[i];
                            var find = false;
                            for(var j=0,maxj=locs.length; j<maxj && !find; j++) {
                                if(locs[j] == t) {
                                    _this.postFreeLocation.splice(j, 1);
                                    find = true;
                                }
                            }
                        }
                    }
                };
                this.updatePfBigBtn = function () {
                    var locs = _this.postFreeLocation();
                    $(".pfBigBtn").each(function () {
                        var arr = $(this).val().split(",");
                        var check = true;
                        for (var i = 0, max = arr.length; i < max && check; i++) {
                            var t = arr[i];
                            var find = false;
                            for (var j = 0, maxj = locs.length; j < maxj && !find; j++) {
                                if (t == locs[j]) find = true;
                            }
                            if (!find) check = false;
                        }
                        $(this).prop("checked", check);
                    });
                };
                this.fastSelectPostFreeLoc = function(str) {
                    var locs = str.split(',');
                    if(str === '') locs = [];
                    _this.postFreeLocation(locs);
                    _this.updatePfBigBtn();
                }
                this.checkPostFreeLocLength = function() {
                    var locs = _this.postFreeLocation();
                    if(locs.length === 0) {
                        alert("请至少选择一个包邮区域");
                    }
                    else {
                        closeModal();
                    }
                }
                this.togglePostFreeLoc = function(val) {
                    if(_this.postFreeLocation.indexOf(val) !== -1 ) {
                        _this.postFreeLocation.remove(val);
                    }
                    else {
                        _this.postFreeLocation.push(val);
                    }
                    _this.updatePfBigBtn();
                }
                this.toSubmitData = function() {
                    var ret = {};
                    var ct = _this.conditionType();
                    if(ct === 'J') {
                        ret['count'] = +_this.conditionJian();
                        ret['countMulti'] = +_this.conditionFengding();
                        if(isNaN(ret['count'])) ret['count'] = _this.conditionJian(); // error
                    }
                    else if(ct === 'Y') {
                        ret['totalPrice'] = Math.round((+_this.conditionYuan()+0.00001)*100);
                        ret['amountMulti'] = +_this.conditionFengding();
                        if(isNaN(ret['totalPrice'])) ret['totalPrice'] = _this.conditionYuan(); // error
                    }
                    var dt = _this.detailType();
                    if(dt === 'P') {
                        ret['decreaseMoney'] = Math.round((+_this.detailPrice()+0.00001)*100);
                        if(isNaN(ret['decreaseMoney'])) ret['decreaseMoney'] = _this.detailPrice(); // error
                    }
                    else if(dt === 'D') {
                        ret['discountRate'] = Math.round((+_this.detailDiscount()+0.00001)*100);
                        if(isNaN(ret['discountRate'])) ret['discountRate'] = _this.detailDiscount(); // error
                    }
                    if(_this.isPostFree()) {
                        var locs = _this.postFreeLocation();
                        ret['area'] = locs.join('|');
                    }
                    if(_this.isGiftName()) {
                        ret['giftName'] = _this.theGiftName();
                    }
                    return ret;
                }
                // initial object
                if(detail) {
                    if('totalPrice' in detail) {
                        this.conditionType('Y');
                        this.conditionYuan(detail.totalPrice/100);
                        this.conditionFengding(detail.amountMulti);
                        if(isNaN(this.conditionYuan())) this.conditionYuan(detail.totalPrice); // error
                    }
                    else if('count' in detail) {
                        this.conditionType('J');
                        this.conditionJian(detail.count);
                        this.conditionFengding(detail.countMulti);
                        if(isNaN(this.conditionJian())) this.conditionJian(detail.count); // error
                    }
                    if('decreaseMoney' in detail) {
                        this.detailType('P');
                        this.detailPrice(detail.decreaseMoney/100);
                        if(isNaN(this.detailPrice())) this.detailPrice(detail.decreaseMoney); // error
                    }
                    else if('discountRate' in detail) {
                        this.detailType('D');
                        this.detailDiscount(detail.discountRate/100);
                        if(isNaN(this.detailDiscount())) this.detailDiscount(detail.discountRate); // error
                    }
                    if('area' in detail) {
                        this.isPostFree(true);
                        if(detail.area !== "") this.fastSelectPostFreeLoc(detail.area.split('|').join(','));
                        else this.fastSelectPostFreeLoc("");
                    }
                    if('giftName' in detail) {
                        this.isGiftName(true);
                        this.theGiftName(detail.giftName);
                    }
                }
                // subscribe for dirty
                this.conditionFengding.subscribe(function() {
                    dirty = true;
                });
                this.conditionYuan.subscribe(function() {
                    dirty = true;
                });
                this.conditionJian.subscribe(function() {
                    dirty = true;
                });
                this.detailDiscount.subscribe(function() {
                    dirty = true;
                });
                this.detailPrice.subscribe(function() {
                    dirty = true;
                });
                this.isGiftName.subscribe(function() {
                    dirty = true;
                });
                this.isPostFree.subscribe(function() {
                    dirty = true;
                });
                this.postFreeLocation.subscribe(function() {
                    dirty = true;
                });
            }
            /* end of DetailPageView */
            $("input.prvc").live("click", function() {
                var b = $(this);
                var w = b.parent();
                var yes = true;
                $("input.prvc", w).each(function() {
                    if(!$(this).prop("checked")) yes = false;
                });
                if(yes) {
                    $("input.pfBigBtn", w).prop("checked", true);
                }
                else {
                    $("input.pfBigBtn", w).prop("checked", false);
                }
            });

            var PageViewModel = function () {
                var _this = this;
                this.settings = ko.observableArray([]);

                this.settings.subscribe(function () {
                    var settings = _this.settings();
                    for (var i = 0, max = settings.length; i < max; i++) {
                        var setting = settings[i];
                        setting.index(i + 1);
                    }
                });

                this.title = ko.observable('');
                this.time = ko.observable('');
                this.comments = ko.observable('');
                this.commentsShow = ko.computed(function() {
                    var c = _this.comments();
                    c = c.replace(/\n/g, '<br>');
                    return c;
                });
                this.currentTag = ko.observable(0);

                this.selectedIndex = ko.observable(0);

                this.selectedDetail = ko.computed(function () {
                    var i = _this.selectedIndex();
                    if (i == 0) return {
                        postFreeLocation: ko.observableArray([])
                    };
                    var s = _this.settings()[i - 1];
                    return s;
                });
                this.addNewDetail = function() {
                    if(_this.settings().length === 10) {
                        alert('最多创建10个优惠详情');
                        return false;
                    }
                    var last = _this.settings()[_this.settings().length-1];
                    var detail = new DetailPageView();
                    detail.postFreeLocation(last.postFreeLocation().slice(0));
                    _this.settings.push(detail);
                    _this.selectedIndex(_this.settings().length);
                }
                this.selectDetail = function(data, event) {
                    _this.selectedIndex(data.index());
                }
                this.removeDetail = function(data, event) {
                    _this.settings.remove(data);
                    if(_this.selectedIndex() > _this.settings().length) {
                        _this.selectedIndex(_this.settings().length);
                    }
                }
                this.toSubmitData = function() {
                    var data = {settings: []};
                    data['comments'] = _this.commentsShow();
                    data['tag'] = _this.currentTag();
                    for(var i=0,max=_this.settings().length; i<max; i++) {
                        var s = _this.settings()[i];
                        data.settings.push(s.toSubmitData());
                    }
                    return data;
                }
                // subscribe for dirty
                this.settings.subscribe(function() {
                    dirty = true;
                });
                this.comments.subscribe(function() {
                    dirty = true;
                });
            }
            /* end of PageViewModel */

            var pageViewModel = new PageViewModel();

            ko.applyBindings(pageViewModel);

            // 初始化
            $.post('mjs-data-3', {'t': Math.random()}, function(res) {
                if(res.success) { // 找到了保存的内容
                    var data = res.data;
                    if (data.comments)
                        pageViewModel.comments(data.comments.replace(/<br>/g,'\n'));
                    if(!isNaN(data.tag)) pageViewModel.currentTag(data.tag);
                    else pageViewModel.currentTag(1);
                    for(var i=0,max=data.settings.length; i<max; i++) {
                        var s = data.settings[i];
                        pageViewModel.settings.push(new DetailPageView(s));
                    }
                }
                else {
                    pageViewModel.currentTag(1);
                    pageViewModel.settings.push(new DetailPageView());
                }
                pageViewModel.selectedIndex(1);
                $(".loading").hide();
            }, 'json');

            $("#nextStepBtn").click(function() {
                // check error
                var errorId = -1;
                for(var i=0,max=pageViewModel.settings().length; i<max; i++) {
                    var s = pageViewModel.settings()[i];
                    if(s.conditionError() || s.detailError()) {
                        errorId = i+1;
                    }
                }
                if(errorId !== -1) {
                    alert("优惠详情中有错误，请修正后再提交");
                    pageViewModel.selectedIndex(errorId);
                    return false;
                }

                var btn = $(this);
                if(btn.hasClass("grayBtn")) return false;
                // submit
                btn.data("text", btn.text())
                   .removeClass("greenBtn")
                   .addClass("grayBtn")
                   .text("正在提交...");

                var data = pageViewModel.toSubmitData();
                data = JSON.stringify(data);
                $.post('mjs-post-3', {'data':data}, function(postres) { // 最后再提交一次
                    $.post('mjs-post-4', {'t': Math.random()}, function(res) { // 提交完毕以后创建活动
                        if(res.success) {
                            window.location.href = 'mjs-4';
                        } else {
                            if (res.code == -37) {
                                // no hra, please do hra now
                                loadModal('#hraModal');
                            }else{
                                alert(res.msg);
                            }
                            btn.removeClass("grayBtn")
                               .addClass("greenBtn")
                               .text(btn.data("text"));
                        }
                    },'json');
                },'json');
            });

            setInterval(function() {
                if(dirty) { // 有修改时才保存
                    var data = pageViewModel.toSubmitData();
                    data = JSON.stringify(data);
                    dirty = false;
                    $.post('mjs-post-3', {'data':data}, function(postres) {
                    },'json');
                }
            }, 5*1000); // 5秒自动保存一次

            // other function
            $("span.pfspan").live("click", function(event) {
                var val = $(this).prev().val();
                var model = ko.contextFor(this);
                var $data = model.$data;
                model.$data.togglePostFreeLoc(val);
            });

        })();
    }
	/* end of mjs step3 */


    /* upgrade page */
    if(bodyId === "upgradePage") {
        (function(){


        $(".upgrade .block").hover(
            function() {
                var block = $(this);
                if(!block.hasClass("selected")) block.addClass("hover")
            },
            function() {
                $(this).removeClass("hover");
            }
        );
        })();
    }
    /* end of upgrade page */

    /* invite page */
    if(bodyId === "invitePage") {
        (function(){

        $("textarea").click(function() {
            $(this).select();
        });

        $("#inviteCopyBtn").click(function() {
            $("textarea").select();
        });
        $('#inviteCopyBtn').zclip({
            path:'/static/js/ZeroClipboard.swf',
            copy: function(){
                return $('textarea').val();
            }
        });

        $(".upgrade .block").hover(
            function() {
                var block = $(this);
                if(!block.hasClass("selected")) block.addClass("hover")
            },
            function() {
                $(this).removeClass("hover");
            }
        );

        })();
    }
    /* end of invite page */

    /* user info page */
    if(bodyId === 'userInfoPage') {
        (function(){

        $("#inviteBtn").click(function() {
            var val = $("#inviteField").val();
            val =$.trim(val);
            if(val !== '' && val !== '谁邀请了您') {
                $.post('invite_by', {nick: val}, function(res) {
                    if(res.success) {
                        $("#inviteField").hide();
                        $("#inviteBtn").hide();
                        $("#inviteDD").text(val);
                    }
                    else {
                        alert(res.msg);
                    }
                }, 'json');
            }
            else {
                alert('请填写邀请您的用户');
            }
        });


        })();
    }
    /* end of user info page */

    /* postfee page */
    if(bodyId === 'postfeePage') {


    }
    /* end of postfee page*/

    /* zkzq page */
    if(bodyId === 'zkzqPage') {
        (function(){

        $(".zkzqCard .mask").css("opacity", 0.7);

        $(".zkzqCard .leftSide a, .zkzqCard .rightSide a, .zkzqCard .category a").hover(
            function() {
                var li = $(this).parent();
                $("a", li).addClass("hover");
            },
            function() {
                var li = $(this).parent();
                $("a", li).removeClass("hover");
            }
        );
        $(".zkzqCard .leftSide a, .zkzqCard .rightSide a").click(function() {
            var li = $(this).parent();
            var ul = li.parent();
            var btn = $(".posterBtn", li);
            var type = 0;
            if (ul.hasClass('leftSide')) type = 2;
            else type = 3;
            if(!btn.hasClass("lightGrayBtn")) {
                $.post(window.location.href,{'type':type,value: li.data('theme')},function(ret){
                    if (ret.success){
                        $("a span", ul).hide();
                        $("a span", li).show();
                        $("a", ul).removeClass("selected");
                        $("a", li).addClass("selected");
                    }else{
                        alert(ret.msg);
                    }
                },'json');
            }
        });
        $(".zkzqCard .category a").click(function() {
            var li = $(this).parent();
            var uls = li.parent().parent().parent();
            var btn = $(".tmplBtn", li);
            if(!btn.hasClass("lightGrayBtn")) {
                $.post(window.location.href,{type:1,value: li.data('theme')},function(ret){
                    if (ret.success){
                        $("a span", uls).hide();
                        $("a span", li).show();
                        $("a", uls).removeClass("selected");
                        $("a", li).addClass("selected");
                    }else{
                        alert(ret.msg);
                    }
                },'json');
            }
        });

        $(".filter .tabs a").click(function() {
            var a = $(this);
            var tabs = a.parent();
            $("a", tabs).removeClass("active");
            a.addClass("active");
            var idx = $("a", tabs).index(a);
            $(".zkzqCards .zkzqCard").hide().eq(idx).show();
        });

        $("#zkzqBtn").click(function() {
            $.post('zkzq_open', function(res) {
                if(res.success) {
                    window.location.href = window.location.href;
                }
                else {
                    alert(res.msg);
                }
            }, 'json');
        });

        $("#refreshZKZQ").click(function() {
            $.post('zkzq_refresh', {t:Math.random()}, function(res) {
                alert(res.msg);
            });
        });
        $("#refreshZKZQ2").click(function() {
            $.post('show-update', {t:Math.random()}, function(res) {
                alert(res.msg);
            });
        });

        $("#refreshZKZQ[data-tooltiptext], #refreshZKZQ2[data-tooltiptext]").hover(
            function(e) {
                var a = $(this);
                var x = $(window).width() - ( a.offset().left + a.width() - 15 );
                var y = a.offset().top + a.height() + 3;
                var tooltip = $("#bottomTooltip");
                $(".html", tooltip).html(a.data("tooltiptext"));
                tooltip.css({ right: x, top: y })
                       .show();
            },
            function() {
                $("#bottomTooltip").hide();
            }
        );

        })();
    }
    /* end of zkzq page */
});

/************** Modal Window Function **************/
function positionModal() {
    var wWidth  = window.innerWidth;
    var wHeight = window.innerHeight;

    if (wWidth==undefined) {
        wWidth  = document.documentElement.clientWidth;
        wHeight = document.documentElement.clientHeight;
    }

    var boxLeft = parseInt((wWidth / 2) - ( $("#modalContainer").width() / 2 ));
    var boxTop  = parseInt((wHeight / 2) - ( $("#modalContainer").height() / 2 ));

    // position modal
    $("#modalContainer").css({
        'margin': boxTop + 'px auto 0 ' + boxLeft + 'px'
    });

    $("#modalBackground").css("opacity", "0.7");
    if ($("body").height() > $("#modalBackground").height()){
        $("#modalBackground").css("height", $("body").height() + "px");
    }
}
function loadModal(itemId) {
    $('#modalBackground').show();
    $('#modalContainer').show();
    $(itemId).show();
    positionModal();
    $(".closeModal").click(function() {
        closeModal();
    });
}
function closeModal() {
    $('.modal').hide();
    $('#modalContainer').hide();
    $('#modalBackground').hide();
}
function setQueryString(uri, key, value) {
    var re = new RegExp("([?|&])" + key + "=.*?(&|$)", "i");
    separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if(uri.match(re)) {
        return uri.replace(re, '$1' + key + "=" + value + '$2');
    }
    else {
        return uri + separator + key + "=" + value;
    }
}
function getQueryString(link, name)  {
    if(link.indexOf("?")==-1 || link.indexOf(name+'=')==-1)  {
        return '';
    }

    var queryString = link.substring(link.indexOf("?")+1);
    var parameters = queryString.split("&");

    var pos, paraName, paraValue;
    for(var i=0; i<parameters.length; i++)  {
        pos = parameters[i].indexOf('=');
        if(pos == -1) {
            continue;
        }

        paraName = parameters[i].substring(0, pos);
        paraValue = parameters[i].substring(pos + 1);

        if(paraName == name) {
            return decodeURI(paraValue.replace(/\+/g, " "));
        }
    }
    return '';
}
function domNodeIsContainedBy(node, containedByNode) {
    if (containedByNode.compareDocumentPosition)
        return (containedByNode.compareDocumentPosition(node) & 16) == 16;
	if(containedByNode == document && node.parentNode) {
		return true;
	}
    while (node != null) {
        if (node == containedByNode)
            return true;
        node = node.parentNode;
    }
    return false;
}
function getParent(node, pattern) {
	var parents = node.parentsUntil(pattern);
	return $(parents[parents.length-1]).parent();
}
/* date functions, author: Matt Kruse <matt@mattkruse.com> WWW: http://www.mattkruse.com/ */
var MONTH_NAMES=new Array('January','February','March','April','May','June','July','August','September','October','November','December','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');
var DAY_NAMES=new Array('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sun','Mon','Tue','Wed','Thu','Fri','Sat');
function LZ(x) {return(x<0||x>9?"":"0")+x}
function isDate(val,format) {
	var date=getDateFromFormat(val,format);
	if (date==0) {return false;}
	return true;
}
function compareDates(date1,dateformat1,date2,dateformat2) {
	var d1=getDateFromFormat(date1,dateformat1);
	var d2=getDateFromFormat(date2,dateformat2);
	if (d1==0 || d2==0) {
		return -1;
    }
	else if (d1 > d2) {
		return 1;
	}
	return 0;
}
function formatDate(date,format) {
	format=format+"";
	var result="";
	var i_format=0;
	var c="";
	var token="";
	var y=date.getYear()+"";
	var M=date.getMonth()+1;
	var d=date.getDate();
	var E=date.getDay();
	var H=date.getHours();
	var m=date.getMinutes();
	var s=date.getSeconds();
	var yyyy,yy,MMM,MM,dd,hh,h,mm,ss,ampm,HH,H,KK,K,kk,k;
	// Convert real date parts into formatted versions
	var value=new Object();
	if (y.length < 4) {y=""+(y-0+1900);}
	value["y"]=""+y;
	value["yyyy"]=y;
	value["yy"]=y.substring(2,4);
	value["M"]=M;
	value["MM"]=LZ(M);
	value["MMM"]=MONTH_NAMES[M-1];
	value["NNN"]=MONTH_NAMES[M+11];
	value["d"]=d;
	value["dd"]=LZ(d);
	value["E"]=DAY_NAMES[E+7];
	value["EE"]=DAY_NAMES[E];
	value["H"]=H;
	value["HH"]=LZ(H);
	if (H==0){value["h"]=12;}
	else if (H>12){value["h"]=H-12;}
	else {value["h"]=H;}
	value["hh"]=LZ(value["h"]);
	if (H>11){value["K"]=H-12;} else {value["K"]=H;}
	value["k"]=H+1;
	value["KK"]=LZ(value["K"]);
	value["kk"]=LZ(value["k"]);
	if (H > 11) {value["a"]="PM";}
	else {value["a"]="AM";}
	value["m"]=m;
	value["mm"]=LZ(m);
	value["s"]=s;
	value["ss"]=LZ(s);
	while (i_format < format.length) {
		c=format.charAt(i_format);
		token="";
		while ((format.charAt(i_format)==c) && (i_format < format.length)) {
			token += format.charAt(i_format++);
		}
		if (value[token] != null) {result=result + value[token];}
		else {result=result + token;}
	}
	return result;
}
function _isInteger(val) {
	var digits="1234567890";
	for (var i=0; i < val.length; i++) {
		if (digits.indexOf(val.charAt(i))==-1) {return false;}
	}
	return true;
}
function _getInt(str,i,minlength,maxlength) {
	for (var x=maxlength; x>=minlength; x--) {
		var token=str.substring(i,i+x);
		if (token.length < minlength) {return null;}
		if (_isInteger(token)) {return token;}
	}
	return null;
}
function getDateFromFormat(val,format) {
	val=val+"";
	format=format+"";
	var i_val=0;
	var i_format=0;
	var c="";
	var token="";
	var token2="";
	var x,y;
	var now=new Date();
	var year=now.getYear();
	var month=now.getMonth()+1;
	var date=1;
	var hh=now.getHours();
	var mm=now.getMinutes();
	var ss=now.getSeconds();
	var ampm="";

	while (i_format < format.length) {
		// Get next token from format string
		c=format.charAt(i_format);
		token="";
		while ((format.charAt(i_format)==c) && (i_format < format.length)) {
			token += format.charAt(i_format++);
			}
		// Extract contents of value based on format token
		if (token=="yyyy" || token=="yy" || token=="y") {
			if (token=="yyyy") {x=4;y=4;}
			if (token=="yy")   {x=2;y=2;}
			if (token=="y")    {x=2;y=4;}
			year=_getInt(val,i_val,x,y);
			if (year==null) {return 0;}
			i_val += year.length;
			if (year.length==2) {
				if (year > 70) {year=1900+(year-0);}
				else {year=2000+(year-0);}
				}
			}
		else if (token=="MMM"||token=="NNN"){
			month=0;
			for (var i=0; i<MONTH_NAMES.length; i++) {
				var month_name=MONTH_NAMES[i];
				if (val.substring(i_val,i_val+month_name.length).toLowerCase()==month_name.toLowerCase()) {
					if (token=="MMM"||(token=="NNN"&&i>11)) {
						month=i+1;
						if (month>12) {month -= 12;}
						i_val += month_name.length;
						break;
						}
					}
				}
			if ((month < 1)||(month>12)){return 0;}
			}
		else if (token=="EE"||token=="E"){
			for (var i=0; i<DAY_NAMES.length; i++) {
				var day_name=DAY_NAMES[i];
				if (val.substring(i_val,i_val+day_name.length).toLowerCase()==day_name.toLowerCase()) {
					i_val += day_name.length;
					break;
					}
				}
			}
		else if (token=="MM"||token=="M") {
			month=_getInt(val,i_val,token.length,2);
			if(month==null||(month<1)||(month>12)){return 0;}
			i_val+=month.length;}
		else if (token=="dd"||token=="d") {
			date=_getInt(val,i_val,token.length,2);
			if(date==null||(date<1)||(date>31)){return 0;}
			i_val+=date.length;}
		else if (token=="hh"||token=="h") {
			hh=_getInt(val,i_val,token.length,2);
			if(hh==null||(hh<1)||(hh>12)){return 0;}
			i_val+=hh.length;}
		else if (token=="HH"||token=="H") {
			hh=_getInt(val,i_val,token.length,2);
			if(hh==null||(hh<0)||(hh>23)){return 0;}
			i_val+=hh.length;}
		else if (token=="KK"||token=="K") {
			hh=_getInt(val,i_val,token.length,2);
			if(hh==null||(hh<0)||(hh>11)){return 0;}
			i_val+=hh.length;}
		else if (token=="kk"||token=="k") {
			hh=_getInt(val,i_val,token.length,2);
			if(hh==null||(hh<1)||(hh>24)){return 0;}
			i_val+=hh.length;hh--;}
		else if (token=="mm"||token=="m") {
			mm=_getInt(val,i_val,token.length,2);
			if(mm==null||(mm<0)||(mm>59)){return 0;}
			i_val+=mm.length;}
		else if (token=="ss"||token=="s") {
			ss=_getInt(val,i_val,token.length,2);
			if(ss==null||(ss<0)||(ss>59)){return 0;}
			i_val+=ss.length;}
		else if (token=="a") {
			if (val.substring(i_val,i_val+2).toLowerCase()=="am") {ampm="AM";}
			else if (val.substring(i_val,i_val+2).toLowerCase()=="pm") {ampm="PM";}
			else {return 0;}
			i_val+=2;}
		else {
			if (val.substring(i_val,i_val+token.length)!=token) {return 0;}
			else {i_val+=token.length;}
			}
		}
	// If there are any trailing characters left in the value, it doesn't match
	if (i_val != val.length) {return 0;}
	// Is date valid for month?
	if (month==2) {
		// Check for leap year
		if ( ( (year%4==0)&&(year%100 != 0) ) || (year%400==0) ) { // leap year
			if (date > 29){return 0;}
			}
		else {if (date > 28) {return 0;}}
		}
	if ((month==4)||(month==6)||(month==9)||(month==11)) {
		if (date > 30) {return 0;}
		}
	// Correct hours value
	if (hh<12 && ampm=="PM") {hh=hh-0+12;}
	else if (hh>11 && ampm=="AM") {hh-=12;}
	var newdate=new Date(year,month-1,date,hh,mm,ss);
	return newdate.getTime();
}
function parseDate(val) {
	var preferEuro=(arguments.length==2)?arguments[1]:false;
	generalFormats=new Array('y-M-d HH:mm:ss','MMM d, y','MMM d,y','y-MMM-d','d-MMM-y','MMM d');
	monthFirst=new Array('M/d/y','M-d-y','M.d.y','MMM-d','M/d','M-d');
	dateFirst =new Array('d/M/y','d-M-y','d.M.y','d-MMM','d/M','d-M');
	var checkList=new Array('generalFormats',preferEuro?'dateFirst':'monthFirst',preferEuro?'monthFirst':'dateFirst');
	var d=null;
	for (var i=0; i<checkList.length; i++) {
		var l=window[checkList[i]];
		for (var j=0; j<l.length; j++) {
			d=getDateFromFormat(val,l[j]);
			if (d!=0) {return new Date(d);}
			}
		}
	return null;
}
/*****
 * google analytic mouse click record
 */
$(document).ready(function() {
    var page = $("body").attr("id");
    // button click
	$("a[data-ga]").live("click", function() {
		var anchor = $(this);
		var name = anchor.data("ga-name");
		_gaq.push(['_trackEvent', 'ButtonClick', name, page]);
	});
    // button hover
    $(".recommendBtn").live("hover", function() {
        var anchor = $(this);
        var name = anchor.data("ga-name");
        _gaq.push(['_trackEvent', 'ButtonHover', name, page]);
        _gaq.push(['_trackEvent', 'RecommendDiscount', 'hover', page]);
    });
    // user track
    var tb_version = $("#tb_version").val();
    var tb_version_name = 'gaoji_user';
    if(tb_version == 2) {
        var name = 'gaoji_user';
        _gaq.push(['_trackEvent', 'userTrack', name, page]);
    }
    else {
        var name = 'chuji_user';
        tb_version_name = name;
        _gaq.push(['_trackEvent', 'userTrack', name, page]);
    }
    // shop_type_track
    var tb_shop_type = $("#tb_shop_type").val();
    if(tb_shop_type === 'C') {
        var name = 'C_user';
        _gaq.push(['_trackEvent', 'userTrack', name, page]);
    }
    else {
        var name = 'B_user';
        _gaq.push(['_trackEvent', 'userTrack', name, page]);
    }
    // status_track
    if($("#last7daysAlertInput").length > 0) {
        var name = 'last7days_' + tb_shop_type + '_' + tb_version_name;
        _gaq.push(['_trackEvent', 'statusTrack', name, page]);
    }
});
