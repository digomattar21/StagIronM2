let magicButton = document.getElementsByClassName('reply-button');
let magicInput = document.getElementsByClassName('reply-input')[0];

function showButton() {
    const magicDiv = document.getElementsByClassName("reply");


    magicDiv.forEach((div, index) => {
        div.style.display = 'block';
    })
}

magicButton = Array.from(magicButton);

magicButton.forEach((button, index) => {
    button.addEventListener('click', () => {
        let magicInput = document.getElementsByClassName('reply-input')[index];
        magicInput.style.visibility = 'visible'
    })
})

