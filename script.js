// ==========================================
// ロジックファイル: script.js
// ==========================================

// スコア管理用（18タイプすべて0で初期化）
let scores = {};
const typesList = Object.keys(typeResults);
typesList.forEach(type => scores[type] = 0);

let currentQuestionIndex = 0;

// 診断開始
function startQuiz() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    showQuestion();
}

// 設問表示
function showQuestion() {
    const question = questions[currentQuestionIndex];
    document.getElementById('question-text').innerText = question.text;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = ''; // リセット

    question.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerText = answer.text;
        button.onclick = () => handleAnswer(answer.types);
        optionsDiv.appendChild(button);
    });
}

// 回答処理
function handleAnswer(selectedTypes) {
    // 選ばれたタイプに加点 (+2点)
    selectedTypes.forEach(type => {
        if(scores[type] !== undefined) {
            scores[type] += 2;
        }
    });

    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResult();
    }
}

// 結果表示
function showResult() {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';

    // スコアの降順ソート
    const sortedScores = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    
    const firstType = sortedScores[0];
    const secondType = sortedScores[1];
    
    // 判定ロジック：1位と2位の差が4点以内なら複合タイプ
    let isDual = (scores[firstType] - scores[secondType]) <= 4;
    
    displayResultContent(firstType, isDual ? secondType : null);
}

// 結果画面の構築
function displayResultContent(type1, type2) {
    const resultTitle = document.getElementById('result-title');
    // const resultDesc = document.getElementById('result-desc');
    const pokemonListDiv = document.getElementById('pokemon-list');
    const pokemonMsg = document.getElementById('pokemon-msg');

    // 1. タイトルと解説の生成
    if (!type2) {
        // 単独タイプ
        const data = typeResults[type1];
        resultTitle.innerHTML = resultTitle.innerHTML = `<span class="type-badge type${data.id}">${type1}</span> タイプ`;
        // resultDesc.innerText = data.desc;
    } else {
        // 複合タイプ（キャッチコピーなどを合体させる簡易版）
        const data1 = typeResults[type1];
        const data2 = typeResults[type2];
        resultTitle.innerHTML = `
            <span class="type-badge type${data1.id}">${type1}</span>
            <span class="cross-mark">×</span>
            <span class="type-badge type${data2.id}">${type2}</span>
        `;
        // resultDesc.innerText = `あなたは「${type1}」の${data1.desc.substring(0, 10)}...という面と、「${type2}」の${data2.desc.substring(0, 10)}...という面を併せ持っています。`;
    }

    // 2. ポケモンデータの取得
    let key = type1;
    if (type2) {
        key = [type1, type2].sort((a, b) => a.localeCompare(b, 'ja')).join('_'); // あいうえお順でキー作成
    }

    const pData = pokemonData[key];
    if (pData) {
        if (pData.pokemons.length > 0) {
            // 既存ポケモン
            pokemonMsg.innerText = "あなたと同じタイプのポケモン：";
            pokemonListDiv.innerText = pData.pokemons.join("、");
            // pData.text も表示したければここに追加
        } else {
            // 未発見（新種）
            pokemonMsg.innerText = "未発見タイプ";
            pokemonListDiv.innerText = pData.text;
            pokemonListDiv.style.color = "red";
            pokemonListDiv.style.fontWeight = "bold";
        }
    } else {
        // データがない珍しい組み合わせ
        pokemonMsg.innerText = "まだ発見されていないタイプの組み合わせです。";
        pokemonListDiv.innerText = `まだデータが少ない希少な ${type1}×${type2} です！`;
    }
    let resultString = type1;
    if (type2) {
        resultString += ` × ${type2}`;
    }
    if (!window.hasSentToGoogle) {
        sendToGoogleForm(resultString);
        window.hasSentToGoogle = true; // 1回だけ送るためのフラグ
    }
}
function sendToGoogleForm(resultText) {
    // フォームのID（URLの /e/ と /viewform の間の文字列）
    const formId = "1FAIpQLScYH5m60EkIE2ZUBnvXu3TmmPKTtXxvvu5fVw3_LCghnqA9QQ";
    
    // 送信先URLの作成
    const formUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;

    // ★重要: ここを調べて書き換えてください！
    // 例: const entryId = "entry.123456789"; 
    const entryId = "entry.1161567998"; 

    // データを作成
    const formData = new FormData();
    formData.append(entryId, resultText);

    // 送信処理 (fetch API)
    fetch(formUrl, {
        method: "POST",
        mode: "no-cors", // これがないとエラーになります
        body: formData
    }).then(() => {
        console.log("Googleフォームに送信しました");
    }).catch(err => {
        console.error("送信エラー:", err);
    });
}
// ==========================================
// X (Twitter) シェア機能
// ==========================================
function shareOnX() {
    // 1. 画面から診断結果のテキストを取得
    // ※ innerTextを使うことで、HTMLタグ（<span>など）を除去した純粋な文字だけ取れます
    const titleText = document.getElementById('result-title').innerText;
    // const descText = document.getElementById('result-desc').innerText;

    // 2. ポストする文章を組み立てる
    // \n は改行です
    const postText = `私のタイプは…\n【 ${titleText} 】でした！\n\n${descText.substring(0, 50)}...\n\n#ポケモンタイプ診断`;

    // 3. あなたのサイトURL（公開後にここを書き換えてください！）
    const siteUrl = "https://311008work-git.github.io/type_diagnosis/"; 

    // 4. Xの投稿画面を開くURLを作成
    // encodeURIComponent は、日本語や記号をURLで使える形式に変換するおまじないです
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(siteUrl)}`;

    // 5. 新しいウィンドウで開く
    window.open(twitterUrl, '_blank');
}