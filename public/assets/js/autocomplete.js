var tickers = [
  "PETR4.SA",
  "VALE3.SA",
  "IRBR3.SA",
  "ITUB3.SA",
  "ITUB4.SA",
  "ITSA3.SA",
  "ITSA4.SA",
  "BBSE3.SA",
  "ABEV3.SA",
  "BOVV11.SA",
  "BOVV.SA",
  "BBDC4.SA",
  "XPCM11.SA",
  "MGLU3.SA",
  "BBAS3.SA",
  "MOVI3.SA",
  "GUAR3.SA",
  "MYPK3.SA",
  "GOLL4.SA",
  "BPAC3.SA",
  "TUPY3.SA",
  "JPSA3.SA",
  "BPAC11.SA",
  "PRIO3.SA",
  "JBSS3.SA",
  "JHSF3.SA",
  "TGMA3.SA",
  "COGN3.SA",
  "COGN4.SA",
  "WEGE3.SA",
  "TAEE3.SA",
  "TRPL4.SA",
  "AALR3.SA",
  "ENBR3.SA",
  "SANB4.SA",
  "BRSR6.SA",
  "BRSR3.SA",
  "BSRS5.SA",
  "IVVB11.SA",
  "BKNG34.SA",
  "HGLG11.SA",
  "KNRI11.SA",
  "BCFF11.SA",
  "ALZR11.SA",
  "MXRF11.SA",
  "XPML11.SA",
  "FLRY3.SA",
  "ESPA3.SA",
  "VAMO3.SA",
  "INTB3.SA",
  "CJCT11.SA",
  "BMLC11.SA",
  "RECR11.SA",
  "URPR11.SA",
  "DEVA11.SA",
  "MFAI11.SA",
  "NGRD3.SA",
  "AVLL3.SA",
  "RRRP3.SA",
  "AERI3.SA",
  "ENJU3.SA",
  "CASH3.SA",
  "TFCO4.SA",
  "CONX3.SA",
  "GMAT3.SA",
  "SEQL3.SA",
  "PASS3.SA",
  "BOAS3.SA",
  "MLEK3.SA",
  "HBSA3.SA",
  "SIMH3.SA",
  "CURY3.SA",
  "PLPL3.SA",
  "PETZ3.SA",
  "PGMN3.SA",
  "LAVV3.SA",
  "LJQQ3.SA",
  "DMVF3.SA",
  "SOMA3.SA",
  "RIVA3.SA",
  "AMBP3.SA",
  "ALPK3.SA",
  "MTRE3.SA",
  "MDNE3.SA",
  "BDLL4.SA",
  "BDLL3.SA",
  "UPSS34.SA",
  "MOSI3.SA",
  
];

$("#yfinance-search").autocomplete({
  source: tickers,
  minLength: 2,
  position: {
    my : "center+75 top+7"
  },
  
});


var input = document.getElementById("yfinance-search");


input.addEventListener("keyup", function (event) {

  

  if (event.keyCode === 13) {

    event.preventDefault();

    document.getElementById("btn-search").click();
  }
});
