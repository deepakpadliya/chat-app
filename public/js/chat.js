const socket = io();

//elements

const $messageForm = document.querySelector('#message-form');

const $messageFormInput = $messageForm.querySelector('input');

const $messageFormButton = $messageForm.querySelector('button');

const $location = document.querySelector('#send-location');

const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true});

const autoScroll = () =>{
    
    //new message element
    const $newMessage = $messages.lastElementChild;
    
    //Height of new message
    const newMessageStyles =getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHight = $newMessage.offsetHeight+ newMessageMargin;

    //visible height
    const visibleHeight = $messages.offsetHeight;

    //Height of message container
    const containerHeight = $messages.scrollHeight;

    //How far i scrolled ?
    const scrollOffset = $messages.scrollTop+visibleHeight;

    if(containerHeight-newMessageHight<=scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message',({username,message,createdAt})=>{
    createdAt = moment(createdAt).format('h:mm a');
    const html = Mustache.render(messageTemplate,{username,message,createdAt});
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();
});

socket.on('locationMessage',({username,url,createdAt})=>{
    console.log(url);
    createdAt = moment(createdAt).format('h:mm a');
    const html = Mustache.render(locationMessageTemplate,{username,url,createdAt});
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{room,users});
    document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    $messageFormButton.setAttribute('disabled','disabled');
    const message = e.target.message.value;

    socket.emit('sendMessage',message,(status)=>{
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value='';
        $messageFormInput.focus();
        console.log('The message has been '+status);
    });
});


$location.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geo location not supported by your browser');
    }
    $location.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((postion)=>{
        console.log(postion);
        const longitude = postion.coords.longitude;
        const latitude = postion.coords.latitude;
        socket.emit('sendLocation',{longitude,latitude},()=>{
            $location.removeAttribute('disabled');
            console.log("Location shared");
        });
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error);
        location.href='/';
    }
})
// socket.on('countUpdated',(count)=>{
//     console.log("count has been updated"+count);
// })

// document.querySelector('#increment').addEventListener('click',()=>{
//     console.log('clicked');
//     socket.emit('increment')
// })