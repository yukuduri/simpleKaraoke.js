const { Player } = TextAliveApp;

//グローバル変数宣言
let c = null;
let setPhraseCount,deletePhraseCount,setCharCount,updateCharCount = 0;
let startTimeOfPhrase, endTimeOfPhrase, textOfPhrase = null;
let isPaused = false;
let pauseTime = null;

$('#control').hide();

const player = new Player({
  app: {
    appAuthor: "yukuduri",
    appName: "simpleKaraoke.js"
  },
  mediaElement: document.querySelector('#media')
});

player.addListener({
  onAppReady: (app) => {
    if (!app.managed) {
      // グリーンライツ・セレナーデ / Omoi feat. 初音ミク
      // - 初音ミク「マジカルミライ 2018」テーマソング
      // - 楽曲: http://www.youtube.com/watch?v=XSLhsjepelI
      // - 歌詞: https://piapro.jp/t/61Y2
      /*player.createFromSongUrl("http://www.youtube.com/watch?v=XSLhsjepelI", {
        video: {
          // 音楽地図訂正履歴: https://songle.jp/songs/1249410/history
          beatId: 3818919,
          chordId: 1207328,
          repetitiveSegmentId: 1942131,
          // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/www.youtube.com%2Fwatch%3Fv%3DXSLhsjepelI
          lyricId: 50145,
          lyricDiffId: 3168
        }
      });*/

      // ブレス・ユア・ブレス / 和田たけあき feat. 初音ミク
      // - 初音ミク「マジカルミライ 2019」テーマソング
      // - 楽曲: http://www.youtube.com/watch?v=a-Nf3QUFkOU
      // - 歌詞: https://piapro.jp/t/Ytwu
      /*player.createFromSongUrl("http://www.youtube.com/watch?v=a-Nf3QUFkOU", {
        video: {
          // 音楽地図訂正履歴: https://songle.jp/songs/1688650/history
          beatId: 3818481,
          chordId: 1546157,
          repetitiveSegmentId: 1942135,
          // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/www.youtube.com%2Fwatch%3Fv=a-Nf3QUFkOU
          lyricId: 50146,
          lyricDiffId: 3143
        }
      });*/

      // 愛されなくても君がいる / ピノキオピー feat. 初音ミク
      // - 初音ミク「マジカルミライ 2020」テーマソング
      // - 楽曲: http://www.youtube.com/watch?v=ygY2qObZv24
      // - 歌詞: https://piapro.jp/t/PLR7
      player.createFromSongUrl("http://www.youtube.com/watch?v=ygY2qObZv24", {
        video: {
          // 音楽地図訂正履歴: https://songle.jp/songs/1977449/history
          beatId: 3818852,
          chordId: 1955797,
          repetitiveSegmentId: 1942043,
          // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/www.youtube.com%2Fwatch%3Fv=ygY2qObZv24
          lyricId: 50150,
          lyricDiffId: 3158
        }
      });
    }
  },

  onAppMediaChange: (mediaUrl) => {
    console.log("新しい再生楽曲が指定されました:", mediaUrl);
    $('#loading').show();
    $('#control').hide();
  },

  // 楽曲情報読み込み完了後、呼ばれる
  // この時点ではrequestPlay()等が実行不能
  onVideoReady: (v) => {
    document.title = player.data.song.name + ' | simpleKaraoke.js'
    
    let infoContents = '';
    infoContents += '<p>楽曲名：<br>' + player.data.song.name + '</p>';
    infoContents += '<p>アーティスト名：<br>' + player.data.song.artist.name + '</p>';
    $('#info').html(infoContents);
    
    $('#control').hide();
    
    resetContents();
    
    // 歌詞情報が取得できなければ終了
    if (!player.video.firstChar) {
      $('#contents').text('この楽曲には歌詞が登録されていません');
      return;
    }

    //フレーズデータをグローバル変数に出力
    const phraseData = player.video.phrases;
    startTimeOfPhrase = [];
    endTimeOfPhrase = [];
    textOfPhrase = [];
    for(let i=0; i<player.video.phraseCount; i++){
      startTimeOfPhrase.push(phraseData[i].startTime);
      endTimeOfPhrase.push(phraseData[i].endTime);
      textOfPhrase.push(phraseData[i].text);
    }
  },

  // 再生準備完了後、呼ばれる
  // これ以降、requestPlay()等が実行可能
  onTimerReady: () => {
    $('#control').show();
    $('#loading').hide();
  },

  onTimeUpdate: (pos) =>{
    /* 
     * onPauseになった後に再生停止した場合、
     * onStopに遷移せず、その直後1回目の
     * onTimeUpdateでのposが最後に停止した
     * 再生位置になっているための例外処理
     */
    //onPauseから復帰した直後1回目かどうか
    if(isPaused){
      pauseTime = pos;
      isPaused = false;
    //onPauseから復帰した直後2回目以降
    }else{
      //停止からの復帰（=一時停止→再生への復帰ではない）
      if(pauseTime && pauseTime > pos) {
        $('#contents').empty();
        c = null;
        setCharCount = 0;
        updateCharCount = 0;
        setPhraseCount = 0;
        deletePhraseCount = 0;
        pauseTime = null;
      }
      //現在の再生位置が各phraseの開始時間5秒前になったら
      if (startTimeOfPhrase && startTimeOfPhrase[setPhraseCount] < pos + 1000*5){
        setPhrase(setPhraseCount++);
      }

      //現在の再生位置が各phraseの終了時間になったら
      if (endTimeOfPhrase && endTimeOfPhrase[deletePhraseCount] <= pos){
        deletePhrase(deletePhraseCount++);
      }

      let currentChar = c || player.video.firstChar;
      //現在の再生位置が各文字の200ms前
      while (currentChar && currentChar.startTime < pos + 200) {
        if (c !== currentChar) {
          updateChar(currentChar, pos, updateCharCount++);
          c = currentChar;
        }
        currentChar = currentChar.next;
      }
    }
    
    
  },
  
  onPause: () => {
    isPaused = true;
  },
  
  onStop: () => {
    resetContents();  
}
});

//再生ボタンクリック時
$('#play').click(() => {
  if (player) {
    if (player.isPlaying) {
      player.requestPause();
      $('#play').html('<img src=\"images/ICOON_MONO/play.svg\">');
    } else {
      player.requestPlay();
      $('#play').html('<img src=\"images/ICOON_MONO/pause.svg\">');
    }
  }
});

//停止ボタンクリック時
$('#stop').click(() => {
  if (player) {
    player.requestStop();
  }
  resetContents();
});

//#mediaの表示／非表示切り替え
$('#switch').click(() => {
  $('#media').slideToggle();
  if($('#switchImage').attr('src')=='images/ICOON_MONO/arrow_button_down.svg'){
    $('#switchImage').attr('src', 'images/ICOON_MONO/arrow_button_up.svg');
  }else{
    $('#switchImage').attr('src', 'images/ICOON_MONO/arrow_button_down.svg');
  }
});

//文字の更新
const updateChar = (current,pos,charCount) =>{
  const updateId = '#char'+charCount;
  $(updateId).addClass('changed');
}

//フレーズを配置
const setPhrase = (pos) =>{
  let contents = '<p id=\"phrase' + pos + '\">';
  let chars = textOfPhrase[pos].split('');
  chars.forEach((char) => {
    contents += '<span id=\"char' + setCharCount++ + '\">';
    contents += char;
    contents += '</span>'
  });
  contents += '</p>';
  $('#contents').append(contents);
}

//フレーズの消去
const deletePhrase = (pos) =>{
  const deleteId = '#phrase'+ pos;
  $(deleteId).remove();
}

//フレーム表示領域リセット
const resetContents = () =>{
  $('#play').html('<img src=\"images/ICOON_MONO/play.svg\">');
  $('#contents').empty();
  c = null;
  setCharCount = 0;
  updateCharCount = 0;
  setPhraseCount = 0;
  deletePhraseCount = 0;
}