const ASCII_CTRL_C = '\x03'
const ASCII_CTRL_D = '\x04'
const ASCII_CTRL_Z = '\x1A'
const KEYCODE_CTRL_Z = 90
const KEYCODE_CTRL_C = 67
const KEYCODE_CTRL_D = 68

var workspace = new Vue({
    el: '#workspace',
    data: {
        editor: Object,
        raw_code: '',
        server_code: '',
        code: '',
        command: '',
        printscreen: '',
        page: false,
        modules: false,
        active_task: '',
        active_task_title: '',
        active_task_index: '',
        active_file: '',
        active_file_readonly: false,
        show_led: false,
        obj_task: [{}],
        task_file_list: [{}],
        wbench_save_status: 0,
        wbench_build_status: 0,
        command_history: [],
        history_counter: -1,
        file_permission_info: {},
        file_mime_info: {},
        errors: [],
        selected_error: '',
        selected_error_line: 0,
        selected_error_index: 0,
        build: 0,
        show_build_output: false,
        show_task_objective: true,
        show_check_result: false,
        update_check: false,
        update_build: false,
        build_passed: false,
        goal: '',
        case_info: {},
        obj: false,
        marker: false,
        restore_editor_cursor: false,
        editor_resize_button: '⇲',
        editor_resize_fullscreen: false
    },

    watch: {
        'code': function (val, oldVal) {
            if (this.code == this.server_code) {
                if (this.active_file_readonly) {
                    this.wbench_save_status = 0
                    this.disable_save_build_check()
                } else {
                    this.wbench_save_status = 1
                    this.ui_save_complete()
                    this.ui_build_ready()
                }

            } else {
                this.ui_save_required()
                this.ui_build_disabled()
                this.ui_check_disabled()
                this.wbench_save_status = 0 // needs saving
                this.wbench_build_status = 0 // needs build
                this.build_passed = false
            }
            this.wbench_build_status = 0 // needs build after save
        }
    },

    mounted() {
        this.ace_settings()
    },

    methods: {
        do_nothing() {},

        compute_args(args_list) {
            var full_args_list = ''
            for (index in args_list) {
                full_args_list = full_args_list + args_list[index]
                if (args_list.length > index + 1) {
                    full_args_list = full_args_list + ', '
                }
            }
            return full_args_list
        },

        select_objective() {
            this.show_task_objective = true
            this.show_build_output = false
            this.show_check_result = false
            document.getElementById("objective").style.background = "black"
            document.getElementById("build_output").style.background = "#333"
            document.getElementById("check_result").style.background = "#333"
            document.getElementById("goal").innerHTML = this.goal
        },

        select_build_output() {
            document.getElementById("objective").style.background = "#333"
            document.getElementById("build_output").style.background = "black"
            document.getElementById("check_result").style.background = "#333"
            this.show_task_objective = false
            this.show_check_result = false
            this.show_build_output = true
        },

        select_check_result() {
            document.getElementById("objective").style.background = "#333"
            document.getElementById("build_output").style.background = "#333"
            document.getElementById("check_result").style.background = "black"
            this.show_task_objective = false
            this.show_build_output = false
            this.show_check_result = true
        },

        set_marker() {
            if (this.marker != false) {
                this.editor.getSession().removeMarker(this.marker)
                this.marker = false
            }
            var range = ace.require(`ace/range`).Range
            this.marker = this.editor.getSession().addMarker(new range(this.errors[this.selected_error_index].line - 1, 0,
                this.errors[this.selected_error_index].line - 1, 1), 'error', 'fullLine', false)
        },

        special_key_event() {
            if (event.keyCode == KEYCODE_CTRL_C) {
                this.send_special_command(ASCII_CTRL_C) //ctrl+c
            }
            if (event.keyCode == KEYCODE_CTRL_D) {
                this.send_special_command(ASCII_CTRL_D) //ctrl+d
            }
            if (event.keyCode == KEYCODE_CTRL_Z) {
                this.send_special_command(ASCII_CTRL_Z) //ctrl+z
            }
        },

        send_special_command(special_command) {
            labx.xmlrpc('wbench_run_command', null, null, login.$data.key, this.tobase64(special_command))
        },

        tobase64(command) {
            base64 = btoa(command)
            var binary_string = atob(base64)
            var len = binary_string.length
            var bytes = new Uint8Array(len)
            for (var i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i)
            }
            return bytes.buffer
        },

        ace_clear_undo() {
            this.editor.getSession().setUndoManager(new ace.UndoManager())
        },

        ace_settings() {
            const lang = 'c_cpp'
            const theme = 'kuroir'
            this.editor = ace.edit("editor")
            this.editor.getSession().setMode(`ace/mode/${lang}`)
            this.editor.setTheme(`ace/theme/${theme}`)
            this.editor.setOptions({
                fontSize: "12.5pt",
                display: "none",
                useWorkers: false,
                showPrintMargin: true,
            })
            this.editor.on('change', () => {
                this.code = this.editor.getValue()
            })
            this.editor.commands.addCommand({
                name: 'wbench_save_shortcut',
                bindKey: {
                    win: 'Ctrl-s',
                    mac: 'Command-s'
                },
                exec: function (editor) {
                    workspace.wbench_save()
                },
                readOnly: false
            })
            this.editor.commands.addCommand({
                name: 'wbench_build_shortcut',
                bindKey: {
                    win: 'Ctrl-b',
                    mac: 'Command-b'
                },
                exec: function (editor) {
                    workspace.wbench_build()
                },
                readOnly: false
            })

            this.editor.commands.addCommand({
                name: 'wbench_check_shortcut',
                bindKey: {
                    win: 'Ctrl-k',
                    mac: 'Command-k'
                },
                exec: function (editor) {
                    workspace.wbench_check()
                },
                readOnly: false
            })
            this.editor.$blockScrolling = Infinity

        },

        input_key() {
            if (event.keyCode == 13)
                document.getElementById('send_command_button').click()
            if (event.keyCode == 38) { //Up-Arrow-Key
                if (this.history_counter < this.command_history.length) {
                    this.history_counter = this.history_counter + 1
                    this.command = this.command_history[this.history_counter]
                }
            }
            if (event.keyCode == 40) { //Down-Arrow-Key
                if (this.history_counter > 0) {
                    this.history_counter = this.history_counter - 1
                    this.command = this.command_history[this.history_counter]
                }
            }
        },

        select_module() {
            modal.get_tasks()
            modal.$data.update_selected_task_info = true
        },

        load_modules_page() {
            login.$data.login_screen = false
            modules.$data.page = true
            workspace.$data.page = false
        },

        logout() {
            labx.logout()
        },

        on_wbench_get_file_info_all_success(response) {
            file_info = response
            for (index in file_info[0]) {
                this.file_permission_info[file_info[0][index]["name"]] = file_info[0][index]["ro"]
                this.file_mime_info[file_info[0][index]["name"]] = file_info[0][index]["mime_type"]
            }
        },

        on_wbench_read_success(response) {
            var cursor_location = this.editor.getCursorPosition()
            this.server_code = response[0]
            this.code = this.server_code
            this.editor.setValue(this.code, 1)
            if (this.file_permission_info[this.active_file] == true) {
                this.active_file_readonly = true
                this.editor.setReadOnly(true)
                this.editor.setOptions({
                    highlightActiveLine: false,
                    highlightGutterLine: false,
                })
                this.editor.renderer.$cursorLayer.element.style.display = "none"
            } else {
                this.active_file_readonly = false
                this.editor.setReadOnly(false)
                this.editor.renderer.$cursorLayer.element.style.display = "inline-block"
                this.editor.setOptions({
                    highlightActiveLine: true,
                    highlightGutterLine: true,
                })
                this.editor.navigateLineStart()
                if (this.restore_editor_cursor) {
                    this.editor.gotoLine(cursor_location.row + 1, cursor_location.column, true)
                    this.restore_editor_cursor = false
                } else {
                    this.editor.gotoLine(1, 0, true)
                }
                this.wbench_build_status = 0
                this.reset_save_build_check()
            }
        },

        select_file(flag) {
            if (flag) {
                this.restore_editor_cursor = true
            }
            labx.xmlrpc('wbench_get_file_info_all', this.on_wbench_get_file_info_all_success, null, login.$data.key)

            labx.xmlrpc('wbench_read', this.on_wbench_read_success, null, login.$data.key, this.active_file)
        },

        on_open_task_success(response) {
            this.goal = response
            document.getElementById("goal").innerHTML = this.goal
            this.active_task = modal.$data.selected_task
            this.active_task_title = modal.$data.selected_task_details
            this.active_task_index = modal.$data.selected_task_index
            this.select_file()
            this.ace_clear_undo()
            this.select_objective()
            this.wb_reset()
            this.update_build = false
            this.update_check = false
            this.build_passed = false
            this.show_check_result = false
        },

        wbench_open_task() {
            labx.xmlrpc('open_task', this.on_open_task_success, null, login.$data.key, modules.$data.selected_module, modal.$data.selected_task)
        },

        reset_save_build_check() {
            this.ui_save_complete()
            this.ui_build_ready()
            this.ui_check_disabled()
        },

        disable_save_build_check() {
            this.ui_save_disabled()
            this.ui_build_disabled()
            this.ui_check_disabled()
        },

        ui_save_disabled() {
            document.getElementById("save_status").style.background = "#333";
            document.getElementById("save").style.color = "#666";
        },

        ui_save_ready() {
            document.getElementById("save_status").style.background = "#333";
            document.getElementById("save").style.color = "white";
        },

        ui_save_required() {
            document.getElementById("save_status").style.background = "red";
            document.getElementById("save").style.color = "white";
        },

        ui_save_complete() {
            document.getElementById("save_status").style.background = "green";
            document.getElementById("save").style.color = "white";
        },

        ui_build_disabled() {
            document.getElementById("build_status").style.background = "#333";
            document.getElementById("build").style.color = "#666";
        },

        ui_build_ready() {
            document.getElementById("build_status").style.background = "#333";
            document.getElementById("build").style.color = "white";
        },

        ui_build_passed() {
            document.getElementById("build_status").style.background = "green";
            document.getElementById("build").style.color = "white";
        },

        ui_build_failed() {
            document.getElementById("build_status").style.background = "red";
            document.getElementById("build").style.color = "white";
        },

        ui_check_disabled() {
            document.getElementById("check_status").style.background = "#333";
            document.getElementById("check").style.color = "#666";
        },

        ui_check_ready() {
            document.getElementById("check_status").style.background = "#333";
            document.getElementById("check").style.color = "white";
        },

        ui_check_passed() {
            document.getElementById("check_status").style.background = "green";
            document.getElementById("check").style.color = "white";
            document.getElementById('info').style.display = 'block';
        },

        ui_check_failed() {
            document.getElementById("check_status").style.background = "red";
            document.getElementById("check").style.color = "white";
        },

        wb_load() {
            this.disable_save_build_check() //color=none before loading file.
            this.obj_task = modal.$data.task_json
            this.task_file_list = this.obj_task[0][modal.$data.selected_task].files
            this.active_file = this.obj_task[0][modal.$data.selected_task].files[0]

            this.wbench_open_task()
        },

        wb_reset() {
            labx.xmlrpc('wbench_reset', null, null, login.$data.key)
        },

        sendcommand() {
            document.getElementById("command").disabled = true
            document.getElementById("send_command_button").style.color = "#444";
            labx.xmlrpc('wbench_run_command', this.on_sendcommand_success, null, login.$data.key, this.tobase64(this.command + '\n'))
            if (this.command == "clear") {
                this.printscreen = ''
            }
        },

        on_sendcommand_success() {
            if (this.command != "") {
                this.command_history.unshift(this.command)
            }
            if (this.command_history.length > 20) {
                this.command_history = this.command_history.splice(0, 20)
            }
            this.history_counter = -1
            this.command = ''
            $("#window").animate({
                scrollTop: $("#terminalp").height()
            }, 10)
            document.getElementById("command").disabled = false
            document.getElementById("send_command_button").style.color = "white"
            document.getElementById("command").focus()
        },

        clear_editor_marker() {
            if (this.marker != false) {
                this.editor.getSession().removeMarker(this.marker)
                this.marker = false
            }
        },

        ui_save_loading_start() {
            document.getElementById("save_status").style.display = "none";
            document.getElementById("save_loader").style.display = "inline-block";
        },

        ui_save_loading_complete() {
            document.getElementById("save_loader").style.display = "none";
            document.getElementById("save_status").style.display = "inline-block";
        },

        ui_build_loading_start() {
            document.getElementById("build_status").style.display = "none";
            document.getElementById("build_loader").style.display = "inline-block";
        },

        ui_build_loading_complete() {
            document.getElementById("build_status").style.display = "inline-block";
            document.getElementById("build_loader").style.display = "none";
        },

        ui_check_loading_start() {
            document.getElementById("check_status").style.display = "none";
            document.getElementById("check_loader").style.display = "inline-block";
        },

        ui_check_loading_complete() {
            document.getElementById("check_status").style.display = "inline-block";
            document.getElementById("check_loader").style.display = "none";
        },

        wbench_save() {
            if (this.active_file_readonly == false) {
                this.editor.setReadOnly(true)
                this.ui_save_loading_start()
                labx.xmlrpc('wbench_save', this.on_wbench_save_success, null, login.$data.key, this.active_file, this.code)
            }
        },

        on_wbench_save_success() {
            this.select_file(true)
            this.ui_save_loading_complete()
            this.ui_save_complete()
            this.ui_build_ready()
            this.ui_check_disabled()
            this.wbench_save_status = 1
        },

        wbench_build() {
            if (this.wbench_save_status == 0) {
                return
            }
            this.clear_editor_marker()
            this.editor.setReadOnly(true)
            this.ui_build_loading_start()
            labx.xmlrpc('wbench_build', this.on_wbench_build_success, null, login.$data.key)
        },

        on_wbench_build_success(response) {
            this.errors.length = 0
            this.build.length = 0
            this.update_build = false
            var build_status = response[0][0]
            this.build = JSON.parse(response[0][1])

            if (build_status == true) {
                this.ui_build_loading_complete()
                this.ui_build_passed()
                this.wbench_build_status = 1
                this.build_passed = true
                this.update_build = true
                this.select_build_output()
                this.editor.getSession().clearAnnotations()
                this.ui_check_ready()
            } else if (build_status == false) {
                this.ui_build_loading_complete()
                this.ui_build_failed()
                this.wbench_build_status = -1
                this.generate_gutter_build_errors(this.build)
                this.update_build = true
                this.select_build_output()
                this.build_passed = false
            }
            this.editor.setReadOnly(false)
        },

        generate_gutter_build_errors(build_error_data) {
            var annotations = this.editor.getSession().getAnnotations()
            annotations.length = 0
            this.build = build_error_data
            var error_icon = "error"
            for (errors in this.build) {
                if (this.build[errors][1] != null) {
                    this.errors.push(this.build[errors][1])
                    if (this.build[errors][1].type != "error") {
                        error_icon = "warning"
                    } else {
                        error_icon = "error"
                    }
                    annotations.push({
                        row: this.build[errors][1].line - 1,
                        column: 0,
                        text: this.build[errors][1].message,
                        type: error_icon,
                    })
                }
            }
            this.editor.getSession().setAnnotations(annotations)
        },

        wbench_check() {
            if (this.wbench_build_status != 1) {
                return
            }
            this.editor.setReadOnly(true)
            this.ui_check_loading_start()
            labx.xmlrpc('wbench_check', this.on_wbench_check_success, null, login.$data.key)
        },

        on_wbench_check_success(response) {
            var check_status = response[0][0]
            this.check = response[0][1]
            this.update_check = false
            for (index in this.check) {
                this.case_info[parseInt(index)] = false
            }
            if (check_status) {
                this.ui_check_passed()
            } else {
                this.ui_check_failed()
            }
            this.ui_check_loading_complete()
            this.update_check = true
            this.select_check_result()
            this.editor.setReadOnly(false)
        },

        wbench_restore_task() {
            labx.xmlrpc('restore_task', this.on_wbench_restore_task_success, null, login.$data.key, modules.$data.selected_module, modal.$data.selected_task)
        },

        on_wbench_restore_task_success() {
            workspace.wb_load()
            this.update_build = false
            this.update_check = false
        },

        editor_resize() {
            if (this.editor_resize_fullscreen == false) {
                this.editor_resize_button = '⇱'
                document.getElementById("editor_window").style.height = "87vh"
                document.getElementById("output").style.display = "none"
                this.editor_resize_fullscreen = true
            } else {
                this.editor_resize_button = '⇲'
                document.getElementById("editor_window").style.height = "46vh"
                document.getElementById("output").style.display = "block"
                this.editor_resize_fullscreen = false
            }
            this.editor.resize()
        },

        wbench_set_key(gpio_key, state) {
            var igpio_key = parseInt(gpio_key)
            var istate = parseInt(state)
            labx.xmlrpc('wbench_set_key', null, null, login.$data.key, igpio_key, istate)
        },

        wbench_keypad_press(keypad_id) {
            var ikeypad_id = parseInt(keypad_id)
            labx.xmlrpc('wbench_keypad_press', null, null, login.$data.key, ikeypad_id)
        },
    },
})