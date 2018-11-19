/**
 * @file demo page for apiDemo
 * @author renzhonghua
 */
/* globals Page, swan */

Page({
    data: {
        title: 'login',
        hasLogin: false
    },

    weakGetUserInfo() {
        swan.getUserInfo({
            success: res => {
                // succ 回调表示拿到用户数据，但有可能是mock数据（用户未登录或者用户拒绝授权）
                // 也可能拿到了真实数据

                // userInfo表示用户明文（非隐私）数据，可以当做UI元素展示，但不能用作用户体系打通
                let userInfo = res.userInfo;
                this.bizWeakGetUserInfoSucc(userInfo)
            }
        })
    },

    // 强用户数据需求。表示会竭尽全力的去拿用户数据，这可能造成用户的手百登录，同意授权等操作。
    forceGetUserInfo() {
        // 先检查是否登录。sessionKey存储在小程序服务端和开发者服务端，用来解密加密数据(data+iv等)
        swan.checkSession({
            success: res => {
                // 意味着小程序服务端和开发者服务端的sessionKey都没有过期，可以进行加解密操作
                // 如果是手百登录，但是小程序没有登录，需要先去获取openid
                let openID = getApp().getOpenID();

                if (!openID) {
                    // 没有openID，说明只是手百登录，但是还没有与三方服务器关联，需要先获取openID
                    this.loginThanDoEvent(this.forceGetUserInfoThanDecrypt);
                    return
                }

                this.forceGetUserInfoThanDecrypt();
            },
            fail: err => {
                // sessionKey失效，需要通过swan.Login去得到sessionKey
                this.loginThanDoEvent(this.forceGetUserInfoThanDecrypt);
            }
        });
    },


        // 不强制要求拿到用户隐私数据。隐私数据可以用做小程序开发者系统和百度用户系统账号打通。
        forceGetUserInfoThanDecrypt() {

            swan.getUserInfo({
                success: res => {
                    // succ 回调表示拿到用户数据，但有可能是mock数据（用户未登录或者用户拒绝授权）
                    // 也可能拿到了真实数据

                    // userInfo表示用户明文（非隐私）数据，可以当做UI元素展示，但不能用作用户体系打通

                    let userInfo = res.userInfo;
                    let iv = res.iv;
                    if (!iv) { // 表明用户拒绝授权
                        this.bizMockGetUserInfo(userInfo)
                        return
                    }

                    let openID = getApp().getOpenID();

                    if (!openID) {
                        // 意味着不是强登录。
                        // 强登录一定会去尝试设置openID, see forceGetUserInfo
                        swan.showModal({
                                title: '函数调用异常',
                                content: '用户标识不存在，需要先登录'
                            })
                            return
                    }
                    swan.showToast({
                        title: 'openID' + openID
                    })
                    // 开始小程序用户体系和开发者用户体系打通
                    swan.request({
                        url: getApp().getUrl('/auth/userinfo'),
                        data: {
                            open_id: openID,
                            data: res.data,
                            iv: res.iv,
                        },
                        method: 'POST',
                        success: res => {
                            // 一个未知bug，第一次调用居然不弹窗
                            this.bizForceGetUserInfoSucc(res.data)
                        },
                        fail: err => {
                            swan.showModal({
                                title: '网络异常',
                                content: JSON.stringify(err),
                            })
                        }
                    });

                },
                fail: err => {
                    swan.showModal({
                        title: 'swan.getUserInfo 失败',
                        content: JSON.stringify(err),
                    })
                }
            })
        },


    loginThanDoEvent(someEvent) {
        swan.login({
            success: res => {
                let code = res.code || '';
                // code 一定要回传给开发者服务器，用了获取sessionKey做后续的解密操作
                // 参考 https://smartprogram.baidu.com/docs/develop/api/open_log/#Session-Key/
                swan.request({
                    url: getApp().getUrl('/auth/login'),
                    data: {
                        code
                    },
                    success: res => {

                        let openID = res.data.data && res.data.data.open_id;
                        if (!openID) {
                            //服务器返回了异常数据
                            swan.showModal({
                                title: '/auth/login 接口异常',
                                content: JSON.stringify(res.data),
                            })
                            return
                        }

                        // 把这个open_id 存起来后续使用
                        getApp().setOpenID(openID)

                        someEvent()
                    },
                    fail: err => {
                        swan.showToast({
                            title: '444'
                        })
                        swan.showModal({
                            title: '/auth/login 网络异常',
                            content: JSON.stringify(err),
                        })
                    }
                });

            },
            fail: err => {
                // 网络异常等未知异常，进行异常处理
                swan.showModal({
                    title: 'swan.Login 失败',
                    content: JSON.stringify(err)
                })
            }
        })
    },



    // 获取用户手机号。用户手机号一定需要sessionKey去解密，所以会有一些前置操作
    getPhoneNumber(data) {
        if (!data.detail.iv) {
            // 说明用户拒绝授权
            swan.showModal({
                title: '用户拒绝授权',
                content: JSON.stringify(data.detail)
            });
            // 业务逻辑
            return;
        }

        this.data.phoneData = data.detail;

        // 解密行为需要服务端（sessionKey）的参与
        let openID = getApp().getOpenID();
        if (!openID) {
            this.loginThanDoEvent(this.bizDecryptPhone);
        }else {
            this.bizDecryptPhone();
        }
    },

    bizDecryptPhone() {
        let phoneData = this.data.phoneData;
        if (!phoneData) {
            return
        }
        swan.request({
            // 请求手机号解密的接口
            url: getApp().getUrl('/auth/phone'),
            method: 'POST',
            data: {
                data: phoneData.encryptedData,
                iv: phoneData.iv,
                open_id: getApp().getOpenID(),
            },
            success: res => {
                this.bizGetPhoneSucc(res.data)
            },
            fail: err => {
                this.bizGetPhoneFail(err)
            }
        })
    },


    // TODO 获取真实用户信息成功业务逻辑
    bizForceGetUserInfoSucc(plainText) {
        swan.showModal({
            title: '强需求得到用户解密数据',
            content: JSON.stringify(plainText),
        })
    },


    // TODO 用户拒绝授权或者未登录，得到mock用户业务逻辑
    bizWeakGetUserInfoSucc(userInfo) {
        swan.showModal({
            title: '弱需求获取用户数据成功',
            content: JSON.stringify(userInfo),
        })
    },


    // TODO 用户拒绝授权或者未登录，得到mock用户业务逻辑
    bizMockGetUserInfo(userInfo) {
        swan.showModal({
            title: '获取用户mock数据成功',
            content: JSON.stringify(userInfo),
        })
    },

    // TODO 获取手机号成功，第三方小程序业务逻辑
    bizGetPhoneSucc(res) {
        swan.showModal({
            title: 'get phone succ ',
            content: JSON.stringify(res)
        })
    },

    // TODO 用户拒绝授权手机号业务逻辑
    bizGetPhoneFail(err) {

        swan.showModal({
            title: '/auth/phone fail ',
            content: JSON.stringify(err)
        })
    }

});
