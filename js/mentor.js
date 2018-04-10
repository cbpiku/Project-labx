var labx = new Vue({
    el: '#labx',
    data: {      
    },
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
        
        logout() {
            labx.xmlrpc('logout', this.on_logout_event, this.on_logout_event, this.key)
        },

        do_nothing() {
            /* Does Absolutely Nothing */
        },
    }
})

var mentor = new Vue({
    el: '#mentor',
    data: {
        toggle_module: '',
        toggle_user: '',
        mentor_editor: Object,
        login_id: '',
        key: '',
        oid: [],
        page_loading: true,
        show_user_list: false,
        show_modules_list: true,
        users: [],
        search_user: '',
        search_module:'',
        search_task: '',
        selected_user:'',
        selected_user_module: '',
        selected_user_task: '',
        selected_user_file: '',
        active_user_file: '',
        user_module_list: [],
        user_tasks_list: [],
        user_file_list: [],
    },
    
    mounted() {
        this.ace_settings()
        this.login_id = localStorage.getItem('login_id')
        this.key  = localStorage.getItem('key').toString()
        labx.xmlrpc('open_mentor_dashboard', this.on_open_mentor_dashboard_success, null, this.key)
    },
    
    computed:
    {
       filtered_users:function() {
           var self=this;
           return this.users.filter(function(cust){
           return cust.name.toLowerCase().indexOf(self.search_user.toLowerCase())>=0
           });
        },
        filtered_user_module_list:function() {
           var self=this;
           return this.user_module_list.filter(function(cust){
           return cust.module.toLowerCase().indexOf(self.search_module.toLowerCase())>=0
           });
        },
        filtered_user_tasks_list:function() {
           var self=this;
           return this.user_tasks_list.filter(function(cust){
           return cust.task.toLowerCase().indexOf(self.search_task.toLowerCase())>=0
           });
        }
    },
    
    methods: {
        ace_settings() {
            const lang = 'c_cpp'
            const theme = 'kuroir'
            /* - Themes - 
               chrome cobalt gruvbox idle_fingers kuroir xcode 
            */
            this.mentor_editor = ace.edit("mentor_editor")
            this.mentor_editor.getSession().setMode(`ace/mode/${lang}`)
            this.mentor_editor.setTheme(`ace/theme/${theme}`)
            this.mentor_editor.setOptions({
                fontSize: "13pt",
                display: "none",
                useWorkers: false,
                showPrintMargin: true,
            })
            this.mentor_editor.$blockScrolling = Infinity
            this.mentor_editor.setReadOnly(true)
            this.mentor_editor.setOptions({
                    highlightActiveLine: false,
                    highlightGutterLine: false,
                })
            /*   
            this.mentor_editor.renderer.$cursorLayer.element.style.display = "none"
            */
            this.mentor_editor.getSession().setUseWrapMode(true);
        },
        
        on_open_mentor_dashboard_success (response, status, jqXHR) {
            this.oid = [response[0][0], response[0][1]]
            this.mentor_get_users()
        },
        
        mentor_get_users() {
            labx.xmlrpc('mentor.get_users', this.on_mentor_get_users_success, null, this.oid)
        },
        
        on_mentor_get_users_success (response) {
            /* Generate User List */
            response[0].sort()
            for ( index in response[0]) {
                this.users[index] = { id : index , name: response[0][index] }  
            }
            //alert(JSON.stringify(this.users))
            this.page_loading = false
            this.show_user_list = true
        },

        select_user(userid) {
            this.selected_user = userid
            labx.xmlrpc('mentor.get_tracks', this.on_mentor_get_tracks_success, null, this.oid, this.selected_user)
            
        },
        on_mentor_get_tracks_success(response) {
            this.user_module_list.splice(0)
            this.toggle_module= undefined
            this.user_tasks_list.splice(0)
            this.toggle_task= undefined
            /* Generate Module List */
            response[0].sort()
            for ( index in response[0]) {
                this.user_module_list[index] = { id : index , module: response[0][index] }  
            }
            this.selected_user_module = '- select module -'
            this.selected_user_task = ' - select task -'
        },
        
        select_user_module(module) {
            this.selected_user_module = module
            labx.xmlrpc('mentor.get_tasks', this.on_mentor_get_tasks_success, null, this.oid, this.selected_user, this.selected_user_module)
        },
        
        on_mentor_get_tasks_success(response) {
            this.user_tasks_list.splice(0)
            this.toggle_task= undefined
            /* Generate Task List */
            response[0].sort()
            for ( index in response[0]) {
                this.user_tasks_list[index] = { id : index, task: response[0][index], status: "todo" }  
            }
            
        },
        
        select_user_task(task) {
            this.selected_user_task = task
            labx.xmlrpc('mentor.get_files', this.on_mentor_get_files_success, null, this.oid, this.selected_user, this.selected_user_module, this.selected_user_task)
        },
        
        on_mentor_get_files_success(response, status, jqXHR) {
            this.user_file_list = response[0]
            default_file = response[0][0]
            this.select_user_file(default_file)    
        },
        
        select_user_file(file) {
            this.selected_user_file = file
            labx.xmlrpc('mentor.get_file_content', this.on_mentor_get_contents_success, null, this.oid, this.selected_user, this.selected_user_module, this.selected_user_task, this.selected_user_file)
        },

        on_mentor_get_contents_success(response) {
            file_data = response[0]
            this.mentor_editor.setValue(file_data);
            this.mentor_editor.gotoLine(0);
            this.active_user_file = this.selected_user_file
        },
        
        refresh() {  
          this.mentor_editor.setValue('');
          this.select_user_file(this.active_user_file)  
        },
        
        logout() {
            labx.logout()
        }
    }
})