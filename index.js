var fs = require('fs');
var data = fs.readFileSync('bun.json');
var wData = fs.readFileSync('words.json');
var kuromoji = require("kuromoji");

var bun = JSON.parse(data);
var wordCat = JSON.parse(wData);
var tempWordCat = wordCat;
var tempBun = bun;
var text = fs.readFileSync("text.txt", "utf-8");

// var source_title = "Gendai";
// var source_url = "www.google.nl";
// var type = "Article";


//split text into sentences by looking for "。"


//generate unique ID
function idGenerator(){
    var string = Math.random().toString(36).substr(2, 16);
    var tStamp = new Date().getMilliseconds();
    var id = string + tStamp;
    id = id.substr(6,15);
    return id;
}


//split text to sentences
var sentences; //deze wordt door gegeven als parameter 's' voor createS
function splitText(){
    var array = text.split("。");
    sentences = array;
}
splitText();


//for all sentences, get words, when done prepare bun for writing.
function createS(s){
    var w;
    for (i = 0; i < s.length; i++){
        if(s[i] != ""){
           getWords(s[i]);
        }
    }
    bun = tempBun;
}
createS(sentences);

var pathCopy;

//get words, writeS
function getWords (sentence){
    var aux = ["られる", "せる", "させる", "れる"]
    var id = idGenerator();
    kuromoji.builder({ dicPath: "node_modules/kuromoji/dict/" }).build(function (err, tokenizer) {
        // tokenizer is ready
        var path = tokenizer.tokenize(sentence);
        pathCopy = path;
        //console.log(path);
        var tempWords = [];
        var tempPos = [];
        for(i=0;i<path.length;i++){
            if(!/\d|\s|・|\.|\?|-|ー|_|＿|\(|\)|!|\+|!|！|,|な|て|[\u3000-\u303F]/.test(path[i].surface_form)  //て en な zijn blijkbaar geen joshi
            && path[i].pos != "助詞"){ 
                if(aux.includes(path[i].basic_form) ==false){
                tempWords.push(path[i].basic_form);
                tempPos.push(path[i].pos);
             }
            }
        }
        writeS(sentence, tempWords, id);
        console.log(bun);
        writeNewDatabase();
        catWords(tempWords, tempPos, id);
    });
 
}


// Write new sentence object with the sentence text, words and id given in createS. Add this to temp database 
//temp database because we only want to write once to json per execution.
function writeS(sen, words, id){
    var newS = {
        sentence:"",
        source_title: "",
        source_url: "",
        type: "",
        words:"",
        conj: {}
    }
    
    newS.sentence = sen;
    newS.words = words;
    console.log("1");

    for(i = 0; i < pathCopy.length ; i++){
       if(pathCopy[i].surface_form != pathCopy[i].basic_form 
        && pathCopy[i].pos == "動詞"){
            var conj　= getConj(sen,pathCopy[i]); //maak ding die conj checkt
           
            newS.conj[pathCopy[i].basic_form]= {
             conj : [conj] 
            }
        }
    }
    tempBun[id] = newS;
}

function getConj(sentence, word){
    var conjunction;
    var masu = new RegExp(word.surface_form + 'ま');
    var conditional_1;
    var conditional_2;
    var past;

    //一段 test
    //potential
    var ichi_pot = new RegExp(word.surface_form + 'れ')
    //passive/potential/sonkeigo
    var ichi_pas = new RegExp(word.surface_form + 'られ')
    //causative
    var ichi_caus = new RegExp(word.surface_form + 'させ(?!ら)')
    //passive causative
    var ichi_pas_caus = new RegExp(word.surface_form + 'させられ')

    //五段 test

    //passive/potential/sonkeigo
    var go_pas = new RegExp(word.surface_form + 'れ')
    //causative
    var go_caus = new RegExp(word.surface_form + 'せ(?!ら)')
    //passive causative
    var go_pas_caus = new RegExp(word.surface_form + 'さ|せら')

    var grTest = new RegExp(word.surface_form)
    console.log("regex: "+ grTest)
    
    if(grTest.test(word.basic_form)){
        //一段
        if(ichi_pot.test(sentence)){
            conjunction = "Potential"
         }else if(ichi_pas.test(sentence)){
            conjunction = "Passive/Honor"
         }else if(ichi_caus.test(sentence)){
            conjunction = "Causative"
         }else if(ichi_pas_caus.test(sentence)){
            conjunction = "Causative Passive "
         }

    }else{
        //五段
         eRow = ["え","け","せ","て","ね","へ","め","れ","べ","げ"]
         if(eRow.includes(word.surface_form.slice(-1))){
            conjunction = "Potential"
         }else if(go_pas.test(sentence)){
            conjunction = "Passive/Honor"
         }else if(go_caus.test(sentence)){
            conjunction = "Causative"
         }else if(go_pas_caus.test(sentence)){
            conjunction = "Causative Passive "
         }                    
    }

    return conjunction
}

//write to database
function writeNewDatabase(){
  //  console.log("Sending Sentences");
    fs.writeFile('bun.json', JSON.stringify(bun,null,2), finished);
}


//When sendS is executed:
function finished() {
  //  console.log('done')
    var count = Object.keys(bun).length;
  //  console.log("Tot senteces in database: " + count);
}

//woord lijst en id van zin wordt mee gegeven, voor die info, push (nieuw)woord in words.json en add zin ID in array
function catWords(w, pos, id){
    for (i = 0; i < w.length ; i++){
        if( tempWordCat[w[i]]){
            tempWordCat[w[i]].in_sentence.push(id);
        }else{
            tempWordCat[w[i]] = {
                in_sentence: [id],
                function: [pos[i]]
            };
        }
    }
    wordCat = tempWordCat;
    writeNewWordCat();
}

function writeNewWordCat(){
//    console.log("Sending WordCat");
    fs.writeFile('words.json', JSON.stringify(wordCat,null,2), finished);
}





// const puppeteer = require('puppeteer');

// (async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto('https://tangorin.com/words?search=%E6%8A%95%E3%81%92%E3%81%95%E3%81%9B%E3%82%89%E3%82%8C%E3%82%8B');
  
//   const textContent = await page.evaluate(() => document.querySelector('p.results-title').innerHTML);

//   console.log(textContent);

//   await browser.close();
// })();