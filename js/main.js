'use strict'

class Roulette {

    /*
    山本メモ：
    constructor()の中のinitTableの中を見ている途中。
    */

    constructor() {

        this.ver = "1.08 Preview"; // 山本が勝手にアップデート
        this.selectPat = 0;

        this.table = document.getElementById('NameTable');
        this.nameFile = document.getElementById("inputNameListFile");
        this.selectedDiv = document.getElementById('selected');

        // ↓「ランダムパターン」のチェックボックス
        this.chkBox = document.getElementById('pattern');

        // ↓「グループ化パターン」のチェックボックス
        this.chkBoxShuffle = document.getElementById('chkShuffle');

        this.verDiv = document.getElementById("ver");
        this.verDiv.innerText="ver."+this.ver;
        this.gNumSel = document.getElementById("grpNum");

        this.rawTxt = "［まだ設定されていません］";
        this.nameList = ["［まだ設定されていません］"];
        this.skipList = [false];
        this.selectedName = this.nameList[ 0];

        this.input = {}; //keyの状態
    	this._keys = {}; //keyの割り当て辞書

        this.target = 0;
        this.curSelected = 0;
        this.count = 0;
        this.isStarted = false;
        this.isRndTable = false;
        this.isSeqTable = true;
        this.sTable = [];
        this.rndTable;
        this.nmlTable; // HTMLで表現した名簿のテーブル、TRとTDつき。
        this.seqTable;
        this.shuffleTable;
        this.initTable();
        this.gnum = 4;

    }

    start = () => {
        this.keybind('space', ' ');
        this._mainLoop();
        this._setEventListener();
    }

    keybind = ( name, key ) => {
        this._keys[name] = key;
        this.input[name] = false;
    }

    _keyEvent = e => {
        e.preventDefault();
        for ( let key in this._keys ) {
            switch ( e.type ) {
                case 'keydown' :
                    if ( e.key === this._keys[key] ) this.input[key] = true;
                        break;
                case 'keyup' :
                    if ( e.key === this._keys[key] ) this.input[key] = false;
                        break;
            }
        }
    }

    onChange = e => {

        if(e.target==this.nameFile) {
            this.fileLoad();
        }

        if(e.target==this.gNumSel) {
            this.gnum = this.gNumSel.value;
            this.initTable();
            console.log("numSel");
        }

        if(e.target==this.chkBoxShuffle) {
            this.gNumSel.disabled = !this.chkBoxShuffle.checked;
            console.log("chkBox");
        }

        if ( this.chkBox.checked){
            this.selectPat = 1; // ランダムパターン
        } else if ( this.chkBoxShuffle.checked){
            this.selectPat = 2; // グループ化パターン
        } else {
            this.selectPat = 0; // デフォルト
        }

    }


    fileLoad = () => {
        const file_list = this.nameFile.files;
        if (!file_list) return;

        const file = file_list[0];
        if(!file) return;

        const file_reader = new FileReader()

        if(file.type.indexOf("text") == 0){
            file_reader.onload = e => {
                const regex =  /[\r\n]/g
                this.rawTxt = file_reader.result;
                this.rawTxt = this.rawTxt.replaceAll(regex, '')
                const list = this.rawTxt.split(',');

                this.nameList = [];
                this.skipList = [];

                for (let i=0;i<list.length;i++) {
                    const attr = list[i].split(":");
                    if(attr.length>=1) this.nameList.push(attr[0]);

                    if(attr.length>=2)
                        if(attr[1]=="skip") this.skipList.push(true);
                        else                this.skipList.push(false);
                    else                    this.skipList.push(false);
                }
                this.initTable();
            };
            file_reader.readAsText(file);
        }
    }

    _setEventListener = () => {
        addEventListener( 'keydown', this._keyEvent, {passive: false});
        addEventListener( 'keyup'  , this._keyEvent, {passive: false});
        addEventListener( 'change' , this.onChange);
    }

    _mainLoop = () => {
        this.onenterframe();
        requestAnimationFrame( this._mainLoop );
    }

    initTable = () => {

        // 選ばれた名前に<BR>が入っていたら、それは削除して最上部に表示する。
        const regex =  "/<BR>/g";
        // ↑ここはダブルクォーテーションなしの /<BR>/g でもいける。
        // これを正規表現リテラルと呼ぶのである。。

        // とにかくテーブルをHTMLでつくっておく。
        // それはthis.nmlTableに入っている。
        this.strNomalTable()

        if ( this.selectPat == 0) { // デフォルト

            // テーブルを表示する。
            this.table.innerHTML = this.nmlTable;
            
            // 選ばれた名前を表示する。
            const name = this.selectedName.replaceAll( regex, '');
            this.selectedDiv.innerText = name;
            // ↑この時点では未設定なので、「さん」をつけない。

        } else if ( this.selectPat == 2) { // グループ化パターン

            // テーブルを表示する。
            this.table.innerHTML = this.nmlTable;

            // 選ばれた名前を表示する。
            this.selectedDiv.innerText = "未抽選";
            
            // ↓sTableにnameListをコピーするのはvar sTable = this.nameList.slice();でもOK
            // ↓var sTable = [];でもOK
            var sTable = new Array();
            for ( let i = 0; i < this.nameList.length; i++) {
                sTable.push( i);
            }
            
            // 名前の順番をシャッフル
            this.sTable = this.shuffle( sTable);

            // ****************** ここまで見た

            this.strShuffleTable();
            this.table.innerHTML = this.shuffleTable;
            
        } else { // ランダムパターン

            this.strRndTable()
            this.table.innerHTML = this.rndTable;
            const name = this.selectedName.replaceAll(regex, '');
            this.selectedDiv.innerText = name+"さん";
            // ↑なぜか「ランダムパターン」にチェックを入れた状態でファイルを読むと、人名が出てしまう。
            // ********** TODO **********

        }
    }

    strSeqTable = () => {
        this.curSelected++;
        if(this.curSelected >= this.nameList.length) this.curSelected=0; 

        let h = "";
        for (let i=0;i<this.nameList.length;i++) {
            if(i % 5 == 0) h += "<TR>";

            if(this.curSelected==i) h += "<TD bgcolor='#FF0000'>";
//            else if(this.target==i) h += "<TD bgcolor='#00FF00'>";
            else       h += "<TD>";

            h += this.nameList[i];
            h += "</TD>";
            if(i+1 % 5 == 0) h += "</TR>\n"; 
        }
        this.seqTable = h;
        this.selectedName = this.nameList[this.curSelected];
    }

    strRndTable = () => {
        let rnd;
        do {
            rnd = Math.floor(Math.random() * this.nameList.length);
        }
        while(this.skipList[rnd]==true);

        let h = "";
        for (let i=0;i<this.nameList.length;i++) {
            if(i % 5 == 0) h += "<TR>";

            if(rnd==i) h += "<TD bgcolor='#FF0000'>";
            else       h += "<TD>";

            h += this.nameList[i];
            h += "</TD>";
            if(i+1 % 5 == 0) h += "</TR>\n"; 
        }
        this.rndTable = h;
        this.selectedName = this.nameList[rnd];
    }

    // ファイルから読んだnameListをHTMLの表にする。
    strNomalTable = () => {

        let h = "";
        for ( let i = 0; i < this.nameList.length; i++) {
            if ( i % 5 == 0) h += "<TR>";
            h += "<TD>";
            h += this.nameList[ i];
            h += "</TD>";
            if ( (i+1) % 5 == 0) h += "</TR>\n"; 
        }
        this.nmlTable = h;

    }

    strShuffleTable = () => {

        const regex =  /<BR>/g;
        let name;
        let h = "";
        const num = this.gnum;
        const all = this.nameList.length;
        const mod = all % num;

        if(((num==3) &&               (all < 4)) ||
           ((num==4) && (mod == 1) && (all < 9)) ||
           ((num==4) && (mod == 2) && (all < 6)) ||
           ((num==5) && (mod == 1) && (all <16)) ||
           ((num==5) && (mod == 2) && (all <12)) ||
           ((num==5) && (mod == 3) && (all < 8)) ) {
            this.shuffleTable = "この人数でのグループ分けは非対応です。";
            return;
        }

        let firstGrp;
        if( mod != 0) {
            firstGrp = all - (num-1) * (num-mod);
        }
        else {
            firstGrp = all;
        }

        for (let i=0;i<firstGrp;i++) {
            name = this.nameList[this.sTable[i]];

            if(i % num == 0) {
                h += "<TR>";
                h += "<TD class='gnum' width='100px' bgcolor='#CCCCFF'>第";
                h += (~~(i/num)+1) ;
                h += "グループ</TD>";
            }
            h += "<TD width='150px'>";
            h += name;
            h += "</TD>";
            if(i+1 % num == 0) h += "</TR>\n"; 
        }

        for (let i=firstGrp;i<all;i++) {
            name = this.nameList[this.sTable[i]];
            if((i-firstGrp) % (num-1) == 0) {
                h += "<TR>";
                h += "<TD class='gnum' width='100px' bgcolor='#CCCCFF'>第";
                h += (firstGrp/num) + (~~((i-firstGrp)/(num-1))+1) ;
                h += "グループ</TD>";
            }
            h += "<TD width='150px'>";
            h += name;
            h += "</TD>";
            if((i-firstGrp+1) % (num-1) == 0) h += "</TR>\n";
        }

        this.shuffleTable = h;
    }

    runRoulette = () => {
        if(this.selectPat==0) {
            this.strSeqTable();
            this.table.innerHTML = this.seqTable;
            const regex =  /<BR>/g;
            const name = this.selectedName.replaceAll(regex, '');
            this.selectedDiv.innerText = name+"さん";
        }
        else if(this.selectPat==2) {
            var sTable = new Array();
            for(let i=0;i<this.nameList.length;i++) {
                sTable.push(i);
            }
            this.sTable = this.shuffle(sTable);
            this.strShuffleTable();
            this.table.innerHTML = this.shuffleTable;
            this.selectedDiv.innerText = "抽選中";
        }
        else {
            this.strRndTable();
            this.table.innerHTML = this.rndTable;
            const regex =  /<BR>/g;
            const name = this.selectedName.replaceAll(regex, '');
            this.selectedDiv.innerText = name+"さん";
        }
    }

    runStep = (n) => {
        setTimeout(
         () => {
             this.runRoulette();
             let tgt;
             if (this.target > this.curSelected ) {
                 tgt = this.target;
             }
             else {
                 tgt = this.target + this.nameList.length;
             }

             if (((tgt-this.curSelected) % this.nameList.length) > 10) {
                 this.runStep(10);
             }
             else if (((this.curSelected) % this.nameList.length) != this.target) {
                 this.runStep(50*this.count++);
             }
             else {
                 this.runFlush(15);
             }
         },
         n
        )
    }

    runFlush = n => {
        setTimeout(
            () => { 
                if(this.selectPat==0) {
                    if(this.isSeqTable) { this.table.innerHTML = this.nmlTable; this.isSeqTable=false;}
                    else                { this.table.innerHTML = this.seqTable; this.isSeqTable=true; }
                }
                else if(this.selectPat==1) {
                    if(this.isRndTable) { this.table.innerHTML = this.nmlTable; this.isRndTable=false;}
                    else                { this.table.innerHTML = this.rndTable; this.isRndTable=true; }
                }
                else {
                    if (n==0) {
                        this.selectedDiv.innerText = "確定";
                    }
                    else {
                        this.selectedDiv.innerText = n;
                        this.runRoulette();
                    }
                    this.table.innerHTML = this.shuffleTable;
                }
                if(n>0) this.runFlush(n-1);
            },
            100
        );
    }

    onenterframe = () => {
        if(this.input.space) {
            if(this.isStarted==false) {

                if(this.chkBox.checked){
                    this.selectPat=1;
                    this.isRndTable=true;
                }
                else if(this.chkBoxShuffle.checked){
                    this.selectPat=2;
                }
                else {
                    this.selectPat=0;
                }

                if(this.selectPat==0) {
                    let rnd;
                    do {
                        rnd = Math.floor(Math.random() * this.nameList.length);
                    }
                    while(this.skipList[rnd]==true);
                    this.target = rnd;
                }
            }
            this.isStarted = true;
            this.count=0;
            this.runRoulette();
        }
        else {
            if(this.isStarted) {
                this.count++;
                let n = 15;
                if(this.selectPat==2) n=0;

                if(this.count < 8) {
                    this.sleep(400*this.count); this.runRoulette();
                }
                else {
                    this.runFlush(n);
                    this.isStarted = false;
                }
             }
        }
    }
    
    /* 
    　以下のシャッフルのアルゴリズム：
    　Fisher–Yates shuffle の改良版である Durstenfeld のアルゴリズムで、
    　Knuth が "Algorithm P (Shuffling)" と称したもの、らしい。
    */
    // *********** TODO **********
    // この引数の受け取り方は、残余引数構文、らしい。
    // 配列をコピーで受け取っているようだ。
    shuffle = ([...array]) => {

        for ( let i = array.length - 1; i >= 0; i--) {
            const j = Math.floor( Math.random() * (i + 1));
            // ↓分割代入を使っている。
            [array[i], array[j]] = [array[j], array[i]];
        }
        
        return array;

    }

    sleep = waitMsec => {
        const startMsec = new Date();
        while (new Date() - startMsec < waitMsec);
    };

}

addEventListener(
    "load",
    () => {
        const r = new Roulette();
        r.start()
    }
);
