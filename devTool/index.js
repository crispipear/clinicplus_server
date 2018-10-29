$(document).delegate('#input', 'keydown', function(e) {
    var keyCode = e.keyCode || e.which;

    if (keyCode == 9) {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;

        // set textarea value to: text before caret + tab + text after caret
        $(this).val($(this).val().substring(0, start)
                    + "\t"
                    + $(this).val().substring(end));

        // put caret at right position again
        this.selectionStart =
        this.selectionEnd = start + 1;
    }
})
$(document).ready(function(){
    // var ip = '10.156.0.1'
    var ip              = 'localhost',
        port            = '3000',
        url             = 'http://'+ip+':'+port,
        socket          = io.connect(url),
        request_type    = 'patients',
        request_action  = 'create',
        request_props   = [
            {
                type: 'appointments',
                props: ['date', 'time']
            },
            {
                type: 'patients',
                props: ['name', 'age']
            }
        ]


    socket.on('response', data => {
        $('.response div').text(data.res)
    })

    socket.io.on('connect_error', function(err) {
        $('#status').text('disconnected')
        $('#status').css('color', 'red')
    });

    socket.on('connect', function(){
        $('#status').text('connected')
        $('#status').css('color', 'green')
    })

    socket.on('init', data => {
        $('#version').text(data.version)
    })

    $('#request_type').change(function(){
        $('.request_form').empty()
        request_type = $(this).find(":selected").text()
        updateFormGroups()
    })
    $('#request_action').change(function(){
        request_action = $(this).find(":selected").text()
    })
    updateFormGroups()
    function updateFormGroups(){
        let selected = request_props.find(item => item.type == request_type)
        let idGroup = "<div class='form-group col-10 row'>"+
                            "<label class='col-3 col-form-label'>id</label>"+
                            "<div class='col-7'>"+
                            "<input name='id' class='form-control' type='text'>"+
                            "</div></div>"
        $('.request_form').append(idGroup)
        $.each(selected.props, function(index, prop){
            let formGroup = "<div class='form-group col-10 row'>"+
                            "<label class='col-3 col-form-label'>"+prop+"</label>"+
                            "<div class='col-7'>"+
                            "<input name="+prop+" class='form-control' type='text'>"+
                            "</div></div>"
            $('.request_form').append(formGroup)
        })
    }

    $('#submit').click(function() {
        let inputs = $('.request_form').find('input:text')
        let req_body = {
            type: request_type,
            action: request_action,
            dataComponent: {}
        }
        $.each(inputs, function(key, input){
            let req_prop = $(input).attr('name')
            let req_val = $(input).val()
            if(req_prop == 'id'){
                req_body[req_prop] = +req_val
            }else{
                if($.isNumeric(req_val)){
                    req_body.dataComponent[req_prop] = +req_val
                }else{
                    req_body.dataComponent[req_prop] = req_val
                }
            }
        })
        $('.payload div').text(JSON.stringify(req_body, null, 4))
        sendRequest(req_body)
    })
    function sendRequest(req){
        socket.emit('post_message', req)
    }
})
