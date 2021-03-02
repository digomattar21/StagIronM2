let replyButtons = document.getElementsByClassName("reply-button");
//let magicInput = document.getElementsByClassName('reply-input')[0];

function showButton() {
  const magicDiv = document.getElementsByClassName("reply");

  magicDiv.forEach((div, index) => {
    div.style.display = "block";
  });
}

replyButtons = Array.from(replyButtons);

replyButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
      console.log('clicked')
    let inputHidden = document.getElementsByClassName("reply-input-hidden")[
      index
    ];
    let input = document.getElementsByClassName("reply-input")[index];
    let replysHidden = document.getElementsByClassName("reply-div-hidden")[0];
    console.log(inputHidden)
    let replys = document.getElementsByClassName("reply-div")[0];

    if (inputHidden) {
      inputHidden.className = "reply-input";
      replysHidden.className ='row reply-div';
      
    } else {
      input.className = "reply-input-hidden";
      replys.className='reply-div-hidden';
    }
  });
});
