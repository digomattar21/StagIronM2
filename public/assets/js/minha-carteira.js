let inputQtd = document.getElementsByClassName("posicao-input");
let currentPrice = document.getElementsByClassName("ticker-current-price");
let posicao = document.getElementsByClassName("ticker-posicao");



    for (let i = 0; i <inputQtd.length; i++) {
        inputQtd[i].addEventListener("change", function (e) {
            let positionUn = parseInt(inputQtd[i].value);
            let position = (positionUn * parseFloat(currentPrice[i].innerHTML)).toFixed(2)
            
            posicao[i].innerHTML = position;

        })
    }






