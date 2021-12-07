'use strict'

class Groups {
    constructor() {
        this.ver = 0.02;

        this.table = document.getElementById('groupTable');
        this.nameFile = document.getElementById("inputNameListFile");
        this.verDiv = document.getElementById("ver");
        this.verDiv.innerText="ver."+this.ver;
        this.gNumSel = document.getElementById("grpNum");
        this.mkGrpBtn = document.getElementById("makeGroup");
        this.msgP = document.getElementById("msg");

        this.input = {}; //keyの状態
	this._keys = {}; //key の割り当て辞書

        this.grpPatNum=10; //とりあえず、やってみるグループの組み合わせ数


        this.nameList=[];
        this.gmod = 0;
        this.nmlTable= "";
        this.gnum = 0;     //1グループを構成する人数
        this.grpDivNum;    //できるグループ総数


        this.grpValid = false;
        this.grpAll = [];
        this.grpAllForce = [];
        this.sTable = [];

        this.initTable();
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

    _mainLoop = () => {
        this.onenterframe();
        requestAnimationFrame( this._mainLoop );
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
        else if(e.target==this.gNumSel) {
            this.gnum = this.gNumSel.value;
            this.msgP.innerText = "グループあたり"+this.gnum+"人です。"
        }
    }

    fileLoad = (e) => {
        const file_list = this.nameFile.files;
        if (!file_list) return;

        const file = file_list[0];
        if(!file) return;

        const file_reader = new FileReader()

        if(file.type.indexOf("text") == 0){
            file_reader.onload = e => {
                const regex =  /[\r\n]/g
                let rawTxt = file_reader.result;
                rawTxt = rawTxt.replaceAll(regex, '')
                this.nameList =  rawTxt.split(',');
                this.msgP.innerText = "全体は"+this.nameList.length+"人です。";
                this.initTable();
            };
            file_reader.readAsText(file);
        }
    }

    _setEventListener = () => {
        addEventListener( 'keydown', this._keyEvent, {passive: false});
        addEventListener( 'keyup'  , this._keyEvent, {passive: false});
        addEventListener( 'change' , this.onChange);
        addEventListener( 'click'  , this.onClick);
    }

    initTable = () => {
        this.gnum = 0;     //1グループを構成する人数
        this.grpDivNum;    //できるグループ総数
        this.grpAll = [];
        this.grpAllForce = [];
        this.sTable = [];

        this.strNomalTable()
        this.table.innerHTML = this.nmlTable;
    }

    strNomalTable = () => {
        let h = "";
        h += "<TR>";
        h += "<TH>氏名</TH>";
        for(let i=0;i<this.grpPatNum;i++){
            h += "<TH>第"+(i+1)+"回</TH>";
        }
        h += "</TR>\n"; 

        for (let i=0;i<this.nameList.length;i++) {
            h += "<TR>";
            h += "<TD>";
            h += this.nameList[i];
            h += "</TD>";
            for(let j=0;j<this.grpPatNum;j++){
                let str;
                if(this.grpValid) {
                    if(this.grpAll[j][i]!=false) {
                       str = String.fromCharCode('A'.charCodeAt(0)+this.sTable[j][this.grpAll[j][i]-1]);
                    }
                    else {
                       str = String.fromCharCode('A'.charCodeAt(0)+this.sTable[j][this.grpAllForce[j][i]-1]);
                       str += " *";
                    }
                }
                else {
                    str = "???";
                }
                h += "<TD>"+str+"</TD>";
            }
            h += "</TR>\n"; 
        }
        this.nmlTable = h;
        console.log(this.sTable);
    }

    onClick = e => {
        if(e.target==this.gNumSel) {
            this.gnum = this.gNumSel.value;
            this.msgP.innerText = "グループあたり"+this.gnum+"人です。"
        }
        else if(e.target==this.mkGrpBtn) {
            if(this.gnum==0) {
                this.msgP.innerText = "グループ人数が不適切です。";
            }
            else {
                const g_mod =  this.nameList.length % this.gnum;
                this.gmod = g_mod;
                const grpDivNum = (this.nameList.length-g_mod)/this.gnum;
//                const grpPatNum = 1+~~((grpDivNum-1)/(this.gnum-1));
                let t  = this.nameList.length+"人を"+this.gnum+"人のグループに分割します。";
                if(g_mod==0) {
                    t += grpDivNum+"グループに分割されます。";
                }
                else {
                    t += grpDivNum+"グループに分割され、";
                    t += g_mod+"人のグループが１つできます。";
                }
                this.msgP.innerText = t;

                this.grpDivNum = grpDivNum;
//                this.grpPatNum = grpPatNum;
                this.grpAll = [];
                this.grpValid = false;
                this.sTable = new Array();

                let gDivNum;
                if(this.gmod!=0) {
                    gDivNum = this.grpDivNum+1;
                }
                else {
                    gDivNum = this.grpDivNum;
                }

                for(let p=0;p<this.grpPatNum;p++){
                    var sTable = new Array();
                    for(let i=0;i<gDivNum;i++) {
                        sTable.push(i);
                    }
                    sTable = this.shuffle(sTable);
                    this.sTable.push(sTable);
                }

                this.calc();

                this.strNomalTable()
                this.table.innerHTML = this.nmlTable;


            }
        }
        else {
            ;//console.log("???");
        }

    }

    shuffle = ([...array]) => {
        for (let i=array.length-1;i>=0;i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    calc = () => {
        let mtx = new Array();
        for (let i=0;i<this.nameList.length;i++) {
            let ary = new Array(); 
            for (let j=0;j<this.nameList.length;j++) {
            //iは軸となるメンバー番号,jはiがいるグループのメンバーとなる可能性があるリスト
                ary.push(false);
           }
           mtx.push(ary);
        }

        const memNum = this.nameList.length;
        for (let p=0;p<this.grpPatNum;p++){
            let member = Array.from(this.getAllFalseAry(memNum));
            for (let g=0;g<this.grpDivNum;g++){
                let gmember = new Array(0);
                for(let m=0;m<this.gnum;m++) {
                   //未割当のメンバを探し、グループ番号gを割り当てる
                   //その際、過去(mtx[][])に同じグループになっていたら、次の候補に
                   if(m==0){
                       for (let i=0;i<memNum;i++) {
                           if(member[i]==false) {
                               member[i]=g+1;
                               gmember.push(i); //i番目の人が(g+1)グループに所属していることを示す
                               break;
                           };
                       }
                   }
                   else if(m==1){
                       for (let i=0;i<memNum;i++) {
                           if((member[i]==false) && (mtx[i][gmember[0]]==false)) {
                               //グループで2人目で、未割り当てで、過去に同じグループになっていない。
                               mtx[i][gmember[0]]=true;
                               member[i]=g+1;
                               gmember.push(i); //i番目の人が(g+1)グループに所属していることを示す
                               break;
                           }
                       }
                   }
                   else if(m==2){
                       for (let i=0;i<memNum;i++) {
                           if((member[i]==false) && (mtx[i][gmember[0]]==false)
                                                 && (mtx[i][gmember[1]]==false)) {
                               //グループで3人目で、未割り当てで、過去に同じグループになっていない。
                               mtx[i][gmember[0]]=true;
                               mtx[i][gmember[1]]=true;
                               member[i]=g+1;
                               gmember.push(i); //i番目の人が(g+1)グループに所属していることを示す
                               break;
                           }
                       }
                   }
                   else if(m==3){
                       for (let i=0;i<memNum;i++) {
                           if((member[i]==false) && (mtx[i][gmember[0]]==false)
                                                 && (mtx[i][gmember[1]]==false)
                                                 && (mtx[i][gmember[2]]==false)) {
                               //グループで4人目で、未割り当てで、過去に同じグループになっていない。
                               mtx[i][gmember[0]]=true;
                               mtx[i][gmember[1]]=true;
                               mtx[i][gmember[2]]=true;
                               member[i]=g+1;
                               gmember.push(i); //i番目の人が(g+1)グループに所属していることを示す
                               break;
                           }
                       }
                   }
                   else if(m==4){
                       for (let i=0;i<memNum;i++) {
                           if((member[i]==false) && (mtx[i][gmember[0]]==false)
                                                 && (mtx[i][gmember[1]]==false)
                                                 && (mtx[i][gmember[2]]==false)
                                                 && (mtx[i][gmember[3]]==false)) {
                               //グループで5人目で、未割り当てで、過去に同じグループになっていない。
                               mtx[i][gmember[0]]=true;
                               mtx[i][gmember[1]]=true;
                               mtx[i][gmember[2]]=true;
                               mtx[i][gmember[3]]=true;
                               member[i]=g+1;
                               gmember.push(i); //i番目の人が(g+1)グループに所属していることを示す
                               break;
                           }
                       }
                   }
                   //console.log("gmember",gmember);
                   //m=1:つまり、グループで２人目([0,1])
                   //m=2:3人目                   ([0,2][1,2])
                   //m=3:4人目                   ([0,3][1,3][2,3])
                   //m=4:5人目                   ([0,4][1,4][2,4][3,4]) の組み合わせを使用済みにする必要あり。
                }
            }

            //console.log("member", member);

            //割り当てられなかった人を強制的にグループに割り当てる
            let memforce = [...member];

            //console.log("memforce",memforce);
            let cntAry = new Array();
            let gDivNum;
            if(this.gmod!=0) {
                gDivNum = this.grpDivNum+1;
            }
            else {
                gDivNum = this.grpDivNum;
            }

            for(let m=0;m<gDivNum;m++) {
                cntAry.push(0);
            }

            for(let i=0;i<memNum;i++) {
                if(member[i]!=false) {
                    cntAry[member[i]-1]++;
                }
            }
            //console.log("cntAry", cntAry);

            for(let i=0;i<memNum;i++) {
                let g;
                if(memforce[i]!=false){
                    continue;
                }
                else {
                    for (g=0;g<gDivNum;g++){
                        if(cntAry[g]==this.gnum){
                            continue;
                        }
                        else {
                            break; 
                        }
                    }
                    cntAry[g]++;
                    memforce[i] = g+1;
                }
            }
            //console.log("memforce",memforce);

            this.grpAll.push([...member]);
            this.grpAllForce.push([...memforce]);
            this.grpValid = true;
        }
    }

    getAllFalseAry = (n) => {
        const ary = Array(n);
        for(let i=0;i<n;i++) ary[i]=false;
        return(ary);
    }


    onenterframe = () => {
        if(this.input.space) {
        }
    }

}

addEventListener( 'load', () => {
    const g = new Groups();
    g.start();
} );

