//publish.js
//获取应用实例
const app = getApp()
import WxValidate from '../../utils/WxValidate.js'
Page({
  data: {
    form: {
      title: "",
      desc: "",
    },
    activekey: 'pic',
    last_active_key: 'pic',
    inputVal: 'pic',
    imglist: [],
    min:5,//最少字数
    max: 500, //最多字数 (根据自己需求改变)
    timer: null,
    anonymous: false,
    is_img_upload: false,
    input: "",
    active_address: "",
    address_list: [],
    limit_pic: 5
  },
  inputs: function (e) {
    var type = e.currentTarget.dataset.type;
    var value = e.detail.value;
    if( type == 'title'){
      this.setData({
        ['form.title']: e.detail.value
      })
    }else{
      // 获取输入框的内容
      // 获取输入框内容的长度
      var len = parseInt(value.length);
      //最多字数限制
      if (len > this.data.max) return;
      // 当输入框内容的长度大于最大长度限制（max)时，终止setData()的执行
      this.setData({
        currentWordNumber: len, //当前字数
        ['form.desc']: value
      })
    }
    },
    ImgAddClick(e) {
        const that = this;
        qq.chooseImage({
            count:that.data.limit_pic, // 默认9
            sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
                var tempFilePaths = res.tempFilePaths;
                let imglist = that.data.imglist;
                for (var i = 0; i < tempFilePaths.length; i++) {
                    if (imglist.length >= that.data.limit_pic) {
                        break
                    } else {
                        imglist.push(tempFilePaths[i])
                    }
                }
                that.setData({
                    imglist: imglist,
                })
            }
        })
    },
    TabChoose(e) {
        var activekey = e.currentTarget.dataset.activekey;
        if (activekey != this.data.last_active_key) {
            this.setData({
                last_active_key: activekey,
                activekey: activekey
            });
        }else{
            this.setData({
                last_active_key: "",
                activekey: ""
            });
        }
    },
    DeleteBtnClick(e) {
        var arr = this.data.imglist;
        arr.splice(e.currentTarget.dataset.index, 1);
        this.setData({
            imglist: arr,
            temporary_imgs: false
        })
    },
    ClearClick() {
        this.setData({
            input: "",
            address_list: []
        })
    },
    TagClick(e) {
        var key = e.target.dataset.key;
        var tags = this.data.tags;
        tags[key].is_active = (!tags[key].is_active);
        let is_active_length = 0
        for (var i = 0; i < tags.length; i++) {
            if (tags[i].is_active) is_active_length++
        }
        if (is_active_length > 2) {
            tags[key].is_active = (!tags[key].is_active);
            app.ShowQQmodal('最多关联两个话题，请重新选择！', "");
            return
        }
        this.setData({
            tags: tags
        });
    },
    AddressClick(e) {
        let address = e.currentTarget.dataset.address;
        this.setData({
            active_address: this.data.active_address === address ? false : address
        })
    },
    getsuggest: function (e) {
        var _this = this;
        var old_timer = this.data.timer;
        if (old_timer) {
            clearTimeout(old_timer)
        }
        this.setData({
            timer: setTimeout(() => {
                if (e.detail.value) {
                    app.globalData.qqmapsdk.getSuggestion({
                        //获取输入框值并设置keyword参数
                        keyword: e.detail.value, //用户输入的关键词，可设置固定值,如keyword:'KFC'
                        // region:"北京", //设置城市名，限制关键词所示的地域范围，非必填参数
                        success: function (res) {//搜索成功后的回调
                            var sug = [];
                            for (var i = 0; i < res.data.length; i++) {
                                sug.push(
                                    res.data[i].title,
                                )
                            }
                            _this.setData({
                                address_list: app.uniq(sug)
                            })
                        },
                    });
                } else {
                    _this.triggerEvent('SearchList', []);
                }
                // 调用关键词提示接口
            }, 700),
            input: e.detail.value,
        })
    },
    previewImage(e) {
        var current = e.target.dataset.src;
        qq.previewImage({
            current: current, // 当前显示图片的http链接
            urls: this.data.imglist // 需要预览的图片http链接列表
        })
    },
    initValidate() {
        const rules = {
            title: {
                required: true,
                maxlength: 30,
                minlength: 3
            },
            desc: {
                required: true,
                maxlength: 500,
                minlength: 5
            },
        }
        const messages = {
            title: {
                required: '标题必须要填写',
                maxlength: '标题最多20个字符',
                minlength: '标题至少2个字符'
            },
            desc: {
                required: '请简要描述内容',
                maxlength: '描述过长，请重新输入',
                minlength: '描述太短啦'
            },
        };
        this.WxValidate = new WxValidate(rules, messages)
    },
    submitBtn: function (e) {
        var that = this;
        var params = this.data.form;
        if (!this.WxValidate.checkForm(params)) {
            const error = this.WxValidate.errorList[0];
            app.ShowQQmodal(error.msg, "");
            return false
        }
        var img_list = this.data.imglist;
        if(this.data.is_img_upload){
            if(img_list.length <=0){
                app.ShowQQmodal('请选择图片', "");
                return
            }
            params['photo'] = '1'
        }else{
            delete params['photo']
        }
        let active_address = this.data.active_address;
        if (active_address) {
            params['address'] = active_address
        } else {
            delete params['address']
        }
        params['tags'] = [];
        params['tg'] = "";
        var tags = this.data.tags;
        for (var index in tags) {
            if (tags[index].is_active) {
                params['tags'].push(tags[index])
            }
        }
        if(this.data.anonymous){
            params['anonymous'] = '1'
        }else{
            delete params['anonymous']
        }
        var temprory = that.data.temporary_imgs;
        app.qqshowloading('发布中，请稍后');
        if (temprory) {
            params['imgs'] = temprory;
            app.WxHttpRequestPOST('activity_add', params, that.PublishDone, app.InterError)
        } else {
            if(img_list.length > 0){
                app.uploadFile('school/',this.data.oss,img_list, function (urls) {
                    that.setData({
                        temporary_imgs: urls
                    });
                    params['imgs'] = urls;
                    app.WxHttpRequestPOST('activity_add', params, that.PublishDone, app.InterError)
                })
            }else{
                app.WxHttpRequestPOST('activity_add', params, that.PublishDone, app.InterError)
            }
        }
    },
    anonymousClick () {
      this.setData({
          anonymous:!this.data.anonymous
      })
    },
    PublishDone(res) {
        qq.hideLoading()
        var data = res.data;
        if (data.code === 200) {
            app.globalData.new_publish = true;
            app.ShowQQmodal('恭喜！发布成功!', '');
            let url = '/pages/activity/activity';
            if(this.data.type === 'img'){
                url = '/pages/photo/photo'
            }
            setTimeout(function () {
                qq.redirectTo({
                    url: url
                })
            }, 1500)
        } else {
            app.ShowToast(data.message)
        }
        qq.hideLoading();
    },
    onLoad: function (options) {
      var type = options.type;
        var that = this;
        app.WxHttpRequestGet('get_upload_sign', {}, function (res) {
            let data = res.data;
            if (data.code === 200) {
                if(type === 'img'){
                    let limitCount = options.limitImg;
                    that.setData({
                        limit_pic:parseInt(limitCount),
                        type:type,
                        is_img_upload:true,
                        oss: data.data.oss,
                        access_token: data.data.access_token,
                        title: '校园风景'
                    })
                }else{
                    that.setData({
                        oss: data.data.oss,
                        type: type,
                        access_token: data.data.access_token,
                        title: "校园动态",
                        tags: data.data.tags
                    })
                }
            } else {
                app.ShowQQmodal("网络错误，请稍后再试～", "");
            }
        });
        this.initValidate();
    },
})
