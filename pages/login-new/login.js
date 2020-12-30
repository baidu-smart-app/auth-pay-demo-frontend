/**
 * @file demo page for apiDemo
 * @author zhangwen22(zhangwen22@baidu.com)
 */
/* globals Page, swan */
const app = getApp();
Page({

    /**
     * 用户同意信息授权
     *
     * @param {Object} event 点击事件对象
     */
    async handleGetUserInfo(event) {
        const {encryptedData, iv} = event.detail;
        // 用户同意授权
        if (encryptedData) {
            // 1、获取 code
            // 2、传给 开发者服务器，开发者服务器使用 code 换 session_key 解码之后，返回 openID
            // 3、拿到openID之后请求 开发者服务器进行信息解密，获得明文业务数据
            this.getLoginCode().then(openID => {
                this.getUserData(openID, iv, encryptedData).then(res => {
                    console.log('用户明文数据：', res);
                });
            })
        }
    },

    /**
     * 获取登录态 code
     *
     * @return {Promise.<resolve,reject>}
     */
    getLoginCode() {
        return new Promise((resolve, reject) => {
            swan.getLoginCode({
                success: res => resolve(this.getOpenID(res.code)),
                fail: reject
            });
        });
    },

    /**
     * 获取 openID
     *
     * @param {string} code 登录授权码
     * @return {Promise}
     */
    getOpenID(code) {
        const that = this;
        return this.syncRequest(
            getApp().getUrl('/auth/login'),
            {
                code
            }
        ).then(res => {
            let openID = res.data.data && res.data.data.open_id;
            if (!openID) {
                //服务器返回了异常数据
                that.showModal({
                    title: '/auth/login 接口异常',
                    content: res.data,
                })
                return;
            }
            app.setOpenID(openID);
            return openID;
        }).catch(error => {
            that.showModal({
                title: '/auth/login 网络异常',
                content: error,
            });
        });
    },

    /**
     * 获取开放业务数据
     *
     * @param {string} openID 小程序登录态ID
     * @param {string} iv 加密向量
     * @param {string} encryptedData 开放数据密文
     */
    getUserData(openID, iv, encryptedData) {
        return this.syncRequest(
            app.getUrl('/auth/userinfo'),
            {
                open_id: openID,
                data: encryptedData,
                iv: iv
            },
            'POST'
        ).then(res => {
            this.showModal({
                title: '完成授权登录',
                content: res.data
            });
            return res.data.data;
        }).catch(error => {
            console.error('/auth/userinfo error', error);
            this.showModal({
                title: '授权失败',
                content: error
            });
        });
    },

    /**
     * 封装 swan.request 为异步方法
     *
     * @param {string} url 请求参数
     * @param {Object} data 请求数据
     * @param {string} method 请求方法
     * @return {Promise} 返回异步请求
     */
    syncRequest(url, data, method = 'GET') {
        return new Promise((resolve, reject) => {
            swan.request({
                url,
                method,
                data,
                success: resolve,
                fail: reject
            });
        });
    },

    /**
     * 获取用户手机号。用户手机号一定需要sessionKey去解密
     *
     * @param {Object} event 点击事件对象
     */
    async handlePhoneNumber(event) {
        if (!event.detail.iv) {
            // 说明用户拒绝授权
            this.showModal({
                title: '请先允许授权后进行操作',
                content: JSON.stringify(event.detail)
            });
            // 业务逻辑
            return;
        }
        this.setData('phoneData', event.detail);

        // 解密行为需要服务端（sessionKey）的参与
        let openID = getApp().getOpenID();
        if (!openID) {
            this.getLoginCode().then(openID => {
                this.requestPhoneNumber(openID).then(res => {
                    console.log('用户手机号：', res);
                });
            });
        }
        else {
            this.requestPhoneNumber(openID).then(res => {
                console.log('用户手机号：', res);
            });
        }
    },

    /**
     * 授权用户获取手机号
     *
     * @param {string} openID 解密需要的
     */
    requestPhoneNumber(openID) {
        let phoneData = this.data.phoneData;
        if (!phoneData) {
            return;
        }
        return this.syncRequest(
            app.getUrl('/auth/phone'),
            {
                data: phoneData.encryptedData,
                iv: phoneData.iv,
                open_id: openID
            },
            'POST'
        ).then(res => {
            this.showModal({
                title: '完成授权登录',
                content: res.data.data
            });
            return res.data.data.mobile;
        }).catch(error => {
            console.error('/auth/phone', error);
            this.showModal({
                title: '授权登录失败',
                content: error
            });
        });
    },

    /**
     * 模态弹窗
     *
     * @param {string} title 弹窗名称
     * @param {string} content 弹窗内容
     */
    showModal(params) {
        const {title, content} = params;
        swan.showModal({
            title,
            content: JSON.stringify(content)
        });
    }

});
