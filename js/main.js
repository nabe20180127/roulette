'use strict'

class Roulette {

    /*
    山本メモ：
    constructor()を見た。
    start()の中の
    　_mainLoop()の中の
    　　onenterframe()の中の
    　　　runFlish()を見ようとしている。
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

        // ↓「1グループあたりの人数」のプルダウン
        this.gNumSel = document.getElementById("grpNum");

        this.rawTxt = "［まだ設定されていません］";
        this.nameList = ["［まだ設定されていません］"];
        this.skipList = [ false];
        this.selectedName = this.nameList[ 0];

        // 下のinputと_keysは空のオブジェクトらしい。
        // 角括弧かドットでプロパティにアクセスできるらしい。
        // プロパティとは、フィールドの意味らしい。
        this.input = {}; //keyの状態
    	this._keys = {}; //keyの割り当て辞書

        this.target = 0;
        this.curSelected = 0; // 現在のカーソル位置
        this.count = 0;
        this.isStarted = false;
        this.isRndTable = false; // ランダムパターンだとtrueにされるが、タイムアウト時の処理に使われるらしい。
        this.isSeqTable = true;
        this.sTable = [];
        this.rndTable;
        this.nmlTable; // HTMLで表現した名簿のテーブル、TRとTDつき。
        this.seqTable; // 同、現在のカーソル位置を進めて、そこに色を塗った版。
        this.shuffleTable;
        this.initTable();
        this.gnum = 4;

    }

    start = () => {
        this.keybind( 'space', ' ');
        this._mainLoop();
        this._setEventListener();
    }

    keybind = ( name, key) => {
        this._keys[ name] = key;
        this.input[ name] = false;
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

        if ( e.target == this.nameFile) {
            this.fileLoad();
        }

        if ( e.target == this.gNumSel) {
            this.gnum = this.gNumSel.value;
            this.initTable();
            console.log("numSel");
        }

        if ( e.target == this.chkBoxShuffle) {
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

        // 選ばれた名前に<BR>が入っていたら、最上部に名前を表示する際、その<BR>は削除する。
        // そのための正規表現を持っておく。
        const regex =  "/<BR>/g";
        // ↑これはダブルクォーテーションなしの /<BR>/g でもいい。
        // この /<BR>/g のようなものを正規表現リテラルと呼ぶのである。。

        // とにかくテーブルをHTMLでつくってthis.nmlTableに入れておく。
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
            // シャッフル後の順番で表を作成
            this.strShuffleTable();
            // 表を表示する
            this.table.innerHTML = this.shuffleTable;

        } else { // ランダムパターン

            // ランダムパターン用の表をつくる。
            this.strRndTable()
            // 表を表示する
            this.table.innerHTML = this.rndTable;

            // 現在選ばれている名前を最上部に表示する。
            // この際に名前から<BR>を除外する。
            const name = this.selectedName.replaceAll( regex, '');
            this.selectedDiv.innerText = name+"さん";
            // ↑なぜか「ランダムパターン」にチェックを入れた状態でファイルを読むと、人名が出てしまう。
            // ********** TODO **********
            
        }
    }

    strSeqTable = () => {

        this.curSelected++;
        if ( this.curSelected >= this.nameList.length){
            this.curSelected = 0;
        }

        let h = "";
        for ( let i = 0; i < this.nameList.length; i++){

            if ( i % 5 == 0){
                h += "<TR>";
            }

            if ( this.curSelected == i){
                h += "<TD bgcolor='#FF0000'>";
            } else {
                h += "<TD>";
            }

            h += this.nameList[ i];
            h += "</TD>";

            if ( (i+1) % 5 == 0){
                h += "</TR>\n"; 
            }

        }
        this.seqTable = h;
        this.selectedName = this.nameList[ this.curSelected];

    }

    // ランダムパターンの際の表をつくる。
    // つまり、ランダムに選ばれた人の名前に色を塗る。
    // 色が塗られている人の名前がthis.selectedNameに入る。
    strRndTable = () => {

        let rnd;
        do {
            rnd = Math.floor( Math.random() * this.nameList.length);
        } while( this.skipList[ rnd] == true);

        let h = "";
        for ( let i = 0; i < this.nameList.length; i++){
            if ( i % 5 == 0) h += "<TR>";
            if ( rnd == i){
                h += "<TD bgcolor='#FF0000'>";
            } else {
                h += "<TD>";
            }
            h += this.nameList[ i];
            h += "</TD>";
            if ( (i+1) % 5 == 0){
                h += "</TR>\n";
            }
        }
        this.rndTable = h;
        this.selectedName = this.nameList[ rnd];
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

    // グループ化パターンの表をHTMLでつくってthis.shuffleTableに保存。
    strShuffleTable = () => {

        const regex =  /<BR>/g;
        let name;
        let h = "";
        const num = this.gnum;

        const all = this.nameList.length;
        const mod = all % num;

        // 以下の一般ルールは？
        // 1グループが必ず(num-1)人以上になるべし、という条件？
        // だとすると、
        // intq=floor(all/num)として、num - mod - 1 < intq のとき、
        // 他グループから1人ずつもってくれば不足グループをnum-1人に補うのに十分、かも。
        // ********** TODO **********
        if ( ( (num == 3) &&               (all <  4)) ||  // i.e. num: 3, all: 1 or 2
             ( (num == 4) && (mod == 1) && (all <  9)) ||  // i.e. num: 4, all: 1 or 5
             ( (num == 4) && (mod == 2) && (all <  6)) ||  // i.e. num: 4, all: 2
             ( (num == 5) && (mod == 1) && (all < 16)) ||  // i.e. num: 5, all: 1 or 6 or 11
             ( (num == 5) && (mod == 2) && (all < 12)) ||  // i.e. num: 5, all: 2 or 7
             ( (num == 5) && (mod == 3) && (all <  8)) ) { // i.e. num: 5, all: 3 
            this.shuffleTable = "この人数でのグループ分けは非対応です。";
            return;
        }

        // 方針：firstGrp人については、num人のグループに分け、
        // 残りは、(num-1)人のグループに分ける。
        let firstGrp;
        if ( mod != 0) {
            firstGrp = all - (num-1) * (num-mod);
        } else {
            firstGrp = all;
        }

        for ( let i = 0; i < firstGrp; i++) {

            name = this.nameList[ this.sTable[ i]];

            if ( i % num == 0){
                h += "<TR>";
                h += "<TD class='gnum' width='100px' bgcolor='#CCCCFF'>第";

                h += (~~(i/num)+1);
                // ↑この ~~ は、Math.floor()と同義？
                // ********* TODO **********

                h += "グループ</TD>";
            }

            h += "<TD width='150px'>";
            h += name;
            h += "</TD>";
            
            if ( (i+1) % num == 0){
                h += "</TR>\n";
            } 

        }

        for (let i = firstGrp; i < all; i++){
            name = this.nameList[ this.sTable[ i]];
            if ( (i-firstGrp) % (num-1) == 0){
                h += "<TR>";
                h += "<TD class='gnum' width='100px' bgcolor='#CCCCFF'>第";
                h += (firstGrp/num) + (~~((i-firstGrp)/(num-1))+1) ;
                h += "グループ</TD>";
            }
            h += "<TD width='150px'>";
            h += name;
            h += "</TD>";
            if ( (i-firstGrp+1) % (num-1) == 0){
                h += "</TR>\n";
            }
        }

        this.shuffleTable = h;

    }

    runRoulette = () => {

        if ( this.selectPat == 0){ // デフォルトのパターン

            this.strSeqTable(); 
            this.table.innerHTML = this.seqTable;
            const regex = /<BR>/g;
            const name = this.selectedName.replaceAll( regex, '');
            this.selectedDiv.innerText = name+"さん";

        } else if ( this.selectPat == 2){ // グループ化パターン

            // sTableに0からの連番を入れる。
            var sTable = new Array();
            for ( let i = 0; i < this.nameList.length; i++){
                sTable.push( i);
            }

            this.sTable = this.shuffle( sTable); 

            this.strShuffleTable();
            this.table.innerHTML = this.shuffleTable;
            this.selectedDiv.innerHTML = "抽選中";

        } else { // ランダムパターン

            this.strRndTable();
            this.table.innerHTML = this.rndTable;
            const regex =  /<BR>/g;
            const name = this.selectedName.replaceAll( regex, '');
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

        if ( this.input.space){ // スペースが押されている場合？

            if ( this.isStarted == false){

                if ( this.chkBox.checked){ // ランダムパターン
                    this.selectPat = 1;
                    this.isRndTable = true;
                } else if ( this.chkBoxShuffle.checked){ // グループ化パターン
                    this.selectPat = 2;
                } else { // デフォルトのパターン
                    this.selectPat = 0;
                }

                // デフォルトのパターンの場合、this.targetがここで決まる。
                if ( this.selectPat == 0){
                    let rnd;
                    do {
                        rnd = Math.floor( Math.random() * this.nameList.length);
                    } while( this.skipList[ rnd] == true);
                    this.target = rnd;
                }

            }
            this.isStarted = true;
            this.count = 0;
            this.runRoulette();

        } else {

            if ( this.isStarted){ // スペースが離された？
                
                // countはスペースが押されたときに0になった。
                this.count++;
                let n = 15;
                if ( this.selectPat == 2){ // グループ化パターンのとき
                    n = 0; // 焦らさない。
                }

                if ( this.count < 8){ // 焦らしながらルーレットを進める
                    this.sleep( 400*this.count);
                    this.runRoulette();
                } else { // ルーレットがストップ！

                    // ********** いまここ

                    this.runFlush( n);
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
