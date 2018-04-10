var labx = new Vue({
    el: '#labx',
    methods: {
        xmlrpc() {
            var arg = $.makeArray(arguments)
            arg.splice(0, 3)
            if (arguments[1] == null) {
                arguments[1] = this.do_nothing
            }
            if (arguments[2] == null) {
                arguments[2] = this.default_xmlrpc_error
            }

            $.xmlrpc({
                url: xmlrpc_url,
                methodName: arguments[0],
                params: arg,
                success: arguments[1],
                error: arguments[2]
            });
        },

        default_xmlrpc_error(response, status, jqXHR) { //Default - show Error Message [Modal]
            document.getElementById('error').style.display = 'block';
        },

        do_nothing() {
            /* Does Absolutely Nothing */
        },

        logout() {
            labx.xmlrpc('logout', this.on_logout_event, this.on_logout_event, login.$data.key)
        },

        on_logout_event() { // Close all Pages/err_msg & switch to login page.
            modules.$data.page = false;
            workspace.$data.page = false;
            login.$data.login_screen = true;
            document.getElementById('error').style.display = 'none';
        },
        open_mentor() {
            /* TODO */
        },
    }
})

var login = new Vue({
    el: '#login',
    data: {
        login_id: '',
        login_pass: '',
        key: '',
        submit_button: true,
        loading: false,
        login_screen: true,
        show_login_error: false, //Shows login Error Messsage.
    },

    methods: {
        login_clear() { //UI - Clear Login/pass Fields. 
            this.login_pass = '';
            this.login_id = '';
            this.show_login_error = false;
            document.getElementById('password').style.border = '0.1vh solid #999'
            document.getElementById('username').style.border = '0.1vh solid #999'
        },
        
        login_focus() { //UI - Clear Login Error Input Field style.
            document.getElementById('password').style.border = '0.1vh solid #999'
            document.getElementById('username').style.border = '0.1vh solid #999'
        },

        login_fail() { //UI - show login err msg, clear pass Field and mark red.
            this.show_login_error = true;
            this.login_pass = '';
            document.getElementById('password').style.border = '0.1vh solid darksalmon'
            document.getElementById('username').style.border = '0.1vh solid darksalmon'
        },

        submit() { //login button onclick.
            this.submit_button = false;
            this.loading = true;
            labx.xmlrpc('login', login.on_login_success, login.on_login_error, this.login_id, this.login_pass);
        },

        on_login_success(response, status, jqXHR) { //xmlrpc:login returns success.
            this.loading = false;
            this.submit_button = true;
            this.login_screen = false;
            modules.$data.page = true;
            this.key = response.toString();
            localStorage.setItem('login_id', this.login_id);
            localStorage.setItem('key', this.key);
            modules.$data.display_name = this.login_id[0].toUpperCase() + this.login_id.slice(1);
            this.login_clear();
        },

        on_login_error(response, status, jqXHR) { //xmlrpc:login returns error.
            this.loading = false;
            this.submit_button = true;
            this.login_fail();
        },
    }
})