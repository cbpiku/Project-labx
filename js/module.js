 var modules = new Vue({
     el: '#modules',
     data: {
         page: false,
         websoc_state: false,
         selected_module: '',
         lcd_state: false,
     },

     methods: {
         logout() {
             labx.logout()
         },

         select_module(module) {
             this.selected_module = module;
             if (this.websoc_state == false) {
                 this.websoc_state = true;
                 this.lcd_state = false;
                 var ws = new WebSocket(ws_url);
                 ws.onopen = function (event) {
                     ws.send(login.$data.key);
                 };
                 ws.onmessage = function (event) {
                     var wsevent_data = JSON.parse(event.data);

                     if (wsevent_data.type == 'leds') {
                         var object = document.getElementById("board");
                         var svgDocument = object.contentDocument;
                         var led = 'led' + wsevent_data.index;
                         var svgled = svgDocument.getElementsByClassName(led);
                         if (wsevent_data.value == true) {
                             svgled[0].style.fill = "#ff3232";
                         } else if (wsevent_data.value == false) {
                             svgled[0].style.fill = "#b3b3b3";
                         }
                     }

                     if (wsevent_data.type == 'terminal') {
                         workspace.$data.printscreen = workspace.$data.printscreen + wsevent_data.append;
                         $("#window").animate({
                             scrollTop: $("#terminalp").height()
                         }, 10);
                     }

                     if (wsevent_data.type == 'lcd') {
                         console.log(wsevent_data);
                         var object = document.getElementById("board");
                         var svgDocument = object.contentDocument;

                         var svgbl = svgDocument.getElementsByClassName("lcd_bl");
                         svgbl[0].style.fill = "#afe9af";
                         this.lcd_state = true;

                         var lcd_data = wsevent_data.display;
                         var cursor = wsevent_data.cursor;

                         var data_lcd0 = wsevent_data.display[0].split("");
                         var data_lcd1 = wsevent_data.display[1].split("");
                         var data_lcd2 = wsevent_data.display[2].split("");
                         var data_lcd3 = wsevent_data.display[3].split("");

                         var arr_data = [data_lcd0, data_lcd1, data_lcd2, data_lcd3];
                         arr_data[cursor[0]][cursor[1]] = '█';

                         var lcd_l0 = Array.prototype.join.call(data_lcd0, "");
                         var lcd_l1 = Array.prototype.join.call(data_lcd1, "");
                         var lcd_l2 = Array.prototype.join.call(data_lcd2, "");
                         var lcd_l3 = Array.prototype.join.call(data_lcd3, "");

                         var svglcd = svgDocument.getElementsByClassName("lcd_l0");
                         svglcd[0].textContent = lcd_l0;

                         svglcd = svgDocument.getElementsByClassName("lcd_l1");
                         svglcd[0].textContent = lcd_l1;

                         svglcd = svgDocument.getElementsByClassName("lcd_l2");
                         svglcd[0].textContent = lcd_l2;

                         svglcd = svgDocument.getElementsByClassName("lcd_l3");
                         svglcd[0].textContent = lcd_l3;
                     }
                 }
             }
             modal.get_tasks();
         },
     }
 })

 var modal = new Vue({
     el: '#modal',
     data: {
         task_json: [{}],
         task: '',
         task_id: '',

         mouseover_task: '-',
         mouseover_task_details: '',
         mouseover_task_status: '-',
         mouseover_task_index: 0,

         selected_task: '',
         selected_task_status: '',
         selected_task_details: 'Select Task',
         selected_task_index: 0,
         update_selected_task_info: false,

         next_task: '',
         next_task_status: '',
         next_task_details: '',
         next_task_index: 0,

         total_tasks: 0,
         tasks_list: 0,
         refresh_task: true,
     },
     methods: {

         logout() {
             labx.logout()
         },

         get_tasks() {
             labx.xmlrpc('get_tasks', modal.on_get_tasks_sucess, null, login.$data.key, modules.$data.selected_module)
         },

         on_get_tasks_sucess(response) {
             var sort_task = [{}]
             this.task_json = response
             tasks = response
             var keys = Object.keys(tasks[0]);
             this.tasks_list = keys;
             var len = keys.length;
             this.total_tasks = keys.length;
             var i;
             keys.sort();
             for (i = 0; i < len; i++) {
                 k = keys[i];
                 sort_task[0][k] = tasks[0][k];
             }
             this.task = sort_task;
             modal.$data.refresh_task = false;
             modal.$data.refresh_task = true;
             if (this.update_selected_task_info) {
                 modal.$data.mouseover_task_index = modal.$data.selected_task_index;
                 modal.$data.mouseover_task = modal.$data.selected_task;
                 modal.$data.mouseover_task_details = modal.$data.task[0][modal.$data.selected_task].title;
                 modal.$data.mouseover_task_status = modal.$data.task[0][modal.$data.selected_task].status;
                 this.update_selected_task_info = false;
             }

             document.getElementById('id01').style.display = 'block';
         },

         get_next_task() {
             if (this.selected_task_index < (this.total_tasks - 1)) {
                 this.next_task_index = (this.selected_task_index + 1);
                 this.next_task = this.tasks_list[this.next_task_index]
                 this.next_task_status = this.task[0][this.next_task].status
                 this.next_task_details = this.task[0][this.next_task].title
             } else {
                 this.next_task = 'NONE';
             }
         },

         load_next_task() {
             if (this.next_task == 'NONE') {
                 document.getElementById('info').style.display = 'none';
                 workspace.load_modules_page();
             } else {
                 this.selected_task_index = this.next_task_index;
                 this.selected_task = this.next_task;
                 this.selected_task_details = this.next_task_details;
                 this.selected_task_status = this.next_task_status;

                 this.mouseover_task_index = this.next_task_index;
                 this.mouseover_task = this.next_task;
                 this.mouseover_task_details = this.next_task_details;
                 this.mouseover_task_status = this.next_task_status;

                 this.get_next_task();
                 workspace.wb_load();
                 document.getElementById('info').style.display = 'none';
             }
         },

         setup_wb() {
             document.getElementById('id01').style.display = 'none';
             login.$data.login_screen = false;
             modules.$data.page = false;
             workspace.$data.page = true;
             workspace.wb_load();
             workspace.ace_settings();
         },
     }
 })