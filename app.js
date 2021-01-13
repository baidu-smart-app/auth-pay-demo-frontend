/* globals App */

App({
    getUrl(path) {
        return this.globalData.host + path
    },

    globalData: {
        userInfo: 'user',
        // 涉及具体业务时，请替换为自己的业务域名
        host: 'http://127.0.0.1:8080'
    },

    getOpenID() {
        // get localStorage
        let openID = '';
        try {
            openID = swan.getStorageSync('openID');
        } catch (e) {
            console.log(e);
            // openID = '';
        }

        return openID;
    },
    setOpenID(openID) {
        try {
            swan.setStorageSync('openID', openID);
        } catch (e) {
        }
        // swan.setStorage({
        //     key: 'openID',
        //     value: openID
        // })
    }
});
