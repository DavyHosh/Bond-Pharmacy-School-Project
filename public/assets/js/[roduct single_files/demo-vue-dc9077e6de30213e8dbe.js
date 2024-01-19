(window.webpackJsonp=window.webpackJsonp||[]).push([[18],{389:function(module,__webpack_exports__,__webpack_require__){"use strict";__webpack_require__.r(__webpack_exports__);var store=__webpack_require__(395),vue_esm=__webpack_require__(393),mixins=__webpack_require__(392),cart=__webpack_require__(402),favorites=__webpack_require__(403),changeLocale=__webpack_require__(404),logout=__webpack_require__(405),services=__webpack_require__(11),i18n=__webpack_require__(397),core=__webpack_require__(10),vue_click_outside=__webpack_require__(394),liveDemo_blockBuyDropdownvue_type_script_lang_js_={name:"blockBuyDropdown",directives:{ClickOutside:__webpack_require__.n(vue_click_outside).a},data:function(){return{isOpened:!1,locale:"en",listBundles:[],listPriceOptions:[],templateInfo:{},listOffers:[],allowedBundles:["template_installation","template_installation_hosting"]}},props:{id:{type:Number,required:!0}},created:function(){var _this=this;this.locale=core.d.getValue(this.$store.state,"locale.code","en");var request=new XMLHttpRequest,url="/website-templates/product-page/list";url+="?locale="+this.locale,url+="&id="+this.id,url+="&_rnd="+Date.now(),request.responseType="json",request.open("GET",url),request.setRequestHeader("x-moto-uid",window.__moto__.motoUid),request.setRequestHeader("x-moto-locale",window.__moto__.locale.code),request.onreadystatechange=function(){if(4===request.readyState&&200===request.status){var response=request.response;void 0!==response&&void 0!==response.body&&(void 0!==response.body.offers&&(_this.listOffers=response.body.offers),void 0!==response.body.template&&(_this.templateInfo=response.body.template,_this.listBundles.push({name:"Template",discountPrice:_this.templateInfo.discountPrice,regularPrice:_this.templateInfo.regularPrice,uid:"only_template"})),void 0!==response.body.priceOptions&&(_this.listPriceOptions=response.body.priceOptions),void 0!==response.body.bundles&&0<response.body.bundles.length&&response.body.bundles.map(function(bundle){~_this.allowedBundles.indexOf(bundle.uid)&&_this.listBundles.push(bundle)}))}},request.send()},methods:{toggleDropDown:function(){this.isOpened=!this.isOpened},hideDropDown:function(){this.isOpened=!1},onClick:function(key){if(void 0!==this.listPriceOptions[key]){var option=this.listPriceOptions[key],_regularPrice=this.templateInfo.regularPrice,_discountPrice=this.templateInfo.discountPrice,_subscriptions={},locale=window.__moto__.locale.code;if(services.e.pushEvent({event:"general-event",eventCategory:"Product Add to Cart",eventAction:"Bundles: "+option.id,eventLabel:this.id}),void 0!==option.isSubscription&&option.isSubscription){_discountPrice=_regularPrice=0;var subscriptionId=option.id;_subscriptions[subscriptionId]={id:subscriptionId,regularPriceFirstPayment:option.regularPriceFirstPayment,discountPriceFirstPayment:option.discountPriceFirstPayment,regularPriceNextPayments:option.regularPriceNextPayments,discountPriceNextPayment:option.discountPriceNextPayment}}else _regularPrice=option.regularPrice,_discountPrice=option.discountPrice;var productType="templates";"convert_motocms3"===option.id&&(productType="convert_motocms3"),this.cartService.setProduct(productType,this.id,{id:this.id,isExclusive:0,totalPrice:_discountPrice,regularPrice:_regularPrice,discountPrice:_discountPrice,finalPrice:_discountPrice,offers:{},subscriptions:_subscriptions},{needUpdatedOrderStorage:!0,needRecalculateOrder:!0,ajaxRequestSuccessCallback:function(data){var _urlCart="/website-templates/cart/";return"en"!==locale&&(_urlCart="/website-templates/"+locale+"/cart/"),window.location.href=_urlCart,!1}})}}},i18n:{messages:{en:{"Buy now":"Buy Now","Choose Your Plan":"Choose Your Plan",yearly:"yr",monthly:"mo","billed annually":"billed annually"},ru:{"Buy now":"Купить","Choose Your Plan":"Выбрать план",yearly:"г.",monthly:"м.","billed annually":"оплата погодично"},de:{"Buy now":"Zur Kasse","Choose Your Plan":"Preisplan wählen",yearly:"J.",monthly:"M.","billed annually":"Jährlich abgerechnet"},es:{"Buy now":"Comprar","Choose Your Plan":"Elegir plan",yearly:"an",monthly:"mes","billed annually":"Facturado anualmente"},pl:{"Buy now":"Kupić","Choose Your Plan":"Wybrać plan",yearly:"r.",monthly:"m.","billed annually":"Płatność rocznie"}}}},componentNormalizer=__webpack_require__(391),blockBuyDropdown=Object(componentNormalizer.a)(liveDemo_blockBuyDropdownvue_type_script_lang_js_,function(){var _vm=this,_h=_vm.$createElement,_c=_vm._self._c||_h;return _c("div",{directives:[{name:"click-outside",rawName:"v-click-outside",value:_vm.hideDropDown,expression:"hideDropDown"}],staticClass:"buy",class:{act:this.isOpened},on:{click:_vm.toggleDropDown}},[_c("div",{staticClass:"title"},[_vm._v(_vm._s(_vm.$t("Choose Your Plan")))]),_vm._v(" "),0<this.listPriceOptions.length&&this.isOpened?_c("div",{staticClass:"drop"},[_c("ul",_vm._l(this.listPriceOptions,function(item,key){return _c("li",{on:{click:function($event){return _vm.onClick(key)}}},[_c("div",{staticClass:"item-el"},[_c("div",{staticClass:"text"},[_vm._v(_vm._s(item.name))]),_vm._v(" "),item.isSubscription?_c("div",{staticClass:"details"},[_c("div",{staticClass:"price",class:{has_discount:+item.regularPriceFirstPayment>+item.discountPriceFirstPayment}},[_c("span",{staticClass:"old_price"},[_vm._v(_vm._s(_vm.$n(item.regularPriceFirstPayment/12,"currency1Cents")))]),_vm._v(" "),_c("span",{staticClass:"current_price"},[_vm._v(_vm._s(_vm.$n(item.discountPriceFirstPayment/12,"currency1Cents"))+" / "+_vm._s(_vm.$t("monthly")))])]),_vm._v(" "),_c("span",{staticClass:"subs"},[_vm._v(_vm._s(_vm.$t("billed annually")))])]):_c("div",{staticClass:"price",class:{has_discount:+item.regularPrice>+item.discountPrice}},[_c("span",{staticClass:"old_price"},[_vm._v(_vm._s(_vm.$n(item.regularPrice,"currencyNoCents")))]),_vm._v(" "),_c("span",{staticClass:"current_price"},[_vm._v(_vm._s(_vm.$n(item.discountPrice,"currencyNoCents")))])])])])}),0)]):_vm._e()])},[],!1,null,null,null).exports,popups=__webpack_require__(400),notices=__webpack_require__(401);vue_esm.a.config.devtools=!1,vue_esm.a.config.performance=!1;var cartService=new services.c;cartService.setCartStore(window.__moto__.cart.full),cartService.setExternalStorageStore(window.__moto__.cart.order),vue_esm.a.prototype.cartService=cartService,vue_esm.a.prototype._businessTrackerMOTO=window._businessTrackerMOTO;new vue_esm.a({el:"#app",store:store.a,i18n:i18n.a,mixins:[mixins.a],components:{Popups:popups.a,Logout:logout.a,Notices:notices.a,CounterCart:cart.a,CounterFavorites:favorites.a,ChangeLocaleNotice:changeLocale.a,BlockBuyDropdown:blockBuyDropdown},mounted:function(){core.b.dispatch({eventName:"app:vue:mounted"})},created:function(){core.b.dispatch({eventName:"moto:vue:created"})}})}}]);