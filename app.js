/* globals App */

App({
    onLaunch(event) {
        console.log('onLaunch');
    },

    onShow(event) {
        console.log('onShow');
    },

    getUrl(path) {
        return this.globalData.host + path
    },

    globalData: {
        userInfo: 'user',
        // host: "http://172.24.200.87:8666"
        host: "http://miniapp.test.liuximu.com"
        // url: 'http://miniapp.test.liuximu.com/auth/login',
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
