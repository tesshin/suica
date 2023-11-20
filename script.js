const { Engine, Render, World, Bodies, Body, Events } = Matter;

// Matter.jsの主要なオブジェクトを作成します。
const engine = Engine.create(); // 物理エンジンのインスタンスを作成
const world = engine.world; // 物理世界を作成
const render = Render.create({
  // レンダリングエンジンを作成
  element: document.getElementById("game-container"), // ゲームを表示するHTML要素
  engine: engine,
  canvas: document.getElementById("game-canvas"),
  options: {
    width: 600, // キャンバスの幅
    height: 600, // キャンバスの高さ
    wireframes: false, // ワイヤーフレームモードを無効にする（カラーで表示）
  },
});

// ユーザーのクリック（タップ）によってフルーツを落とす
// ユーザーがキャンバスをクリックしたときにフルーツを落とすイベントリスナーを設定
document
  .getElementById("game-canvas")
  .addEventListener("mousedown", function (event) {
    // クリックされた位置を取得
    let rect = render.canvas.getBoundingClientRect();
    let x = event.clientX - rect.left; // x座標
    let y = event.clientY - rect.top; // y座標

    // クリックされた位置にフルーツを生成し、ゲームに追加
    let fruit = createFruit(currentFruitIndex, x, y);
    fruitsInGame.push(fruit);
    generateFruit(); // 次のフルーツをランダムに選択
  });

// フルーツの種類とそれに対応する色
const fruits = [
  "サクランボ",
  "イチゴ",
  "ブドウ",
  "デコポン",
  "みかん",
  "リンゴ",
  "梨",
  "桃",
  "パイナップル",
  "メロン",
  "スイカ",
];
const colors = [
  "#FF69B4",
  "#FF0000",
  "#800080",
  "#FFD700",
  "#FFA500",
  "#FF0000",
  "#FFFF00",
  "#FFC0CB",
  "#FFD700",
  "#90EE90",
  "#008000",
];

let currentFruitIndex = 0; // 現在選択されているフルーツのインデックス
let score = 0; // スコア

let fruitsInGame = []; // ゲーム中のフルーツを追跡する配列

// 次に落とすフルーツをランダムに選択し、表示する関数
function generateFruit() {
  currentFruitIndex = Math.floor(Math.random() * fruits.length);
  document.getElementById("next-name").textContent = fruits[currentFruitIndex];
  document.getElementById("next-color").style.backgroundColor =
    colors[currentFruitIndex];
}

// ゲームボードの底に「床」を追加
const ground = Bodies.rectangle(300, 590, 600, 20, {
  isStatic: true, // 静的オブジェクト（動かない）
  render: { fillStyle: "#959595" },
});
World.add(world, ground); // 作成した床を物理世界に追加

// フルーツを落とす関数（修正）
function dropFruit() {
  let fruit = createFruit(currentFruitIndex, 300, 0); // 現在のフルーツを生成
  fruitsInGame.push(fruit);
  generateFruit(); // 次のフルーツを生成（注：これを先に呼び出すと、落とすフルーツが変わってしまう）
}

// スコア更新関数
function updateScore(points) {
  score += points;
  document.getElementById("score").textContent = score;
}

// 衝突イベント（修正）
Events.on(engine, "collisionStart", function (event) {
  let pairs = event.pairs;

  for (let i = 0, j = pairs.length; i != j; ++i) {
    let pair = pairs[i];

    // 衝突したフルーツを検出
    let fruitA = fruitsInGame.find((f) => f.body === pair.bodyA);
    let fruitB = fruitsInGame.find((f) => f.body === pair.bodyB);

    // 同じ種類のフルーツが衝突した場合
    if (fruitA && fruitB && fruitA.index === fruitB.index) {
      // スコアを更新
      updateScore(fruitA.index + 1);

      // フルーツを削除
      World.remove(world, fruitA.body);
      World.remove(world, fruitB.body);
      fruitsInGame = fruitsInGame.filter(
        (f) => f.body !== fruitA.body && f.body !== fruitB.body
      );

      // 新しいフルーツを生成（次のフルーツへ進化）
      let newIndex = Math.min(fruitA.index + 1, fruits.length - 1);
      let newFruit = createFruit(
        newIndex,
        pair.bodyA.position.x,
        pair.bodyA.position.y
      );
      fruitsInGame.push(newFruit);
    }
  }
});

// 重力の設定（例）
engine.world.gravity.y = 1; // 重力を1に設定（調整可能）
// ゲームボードの左右に壁を追加
const leftWall = Bodies.rectangle(0, 300, 20, 600, { isStatic: true });
const rightWall = Bodies.rectangle(600, 300, 20, 600, { isStatic: true });
World.add(world, [leftWall, rightWall, ground]); // 壁と床を追加

// フルーツの大きさを設定する配列（サイズ変更）
const fruitSizes = [
  600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600,
];

// フルーツの生成関数（大きさを変更）
function createFruit(index, x, y) {
  let size = fruitSizes[index] / 50; // サイズが大きすぎる場合は適切にスケーリングする
  let fruit = Bodies.circle(x, y, size, {
    render: {
      fillStyle: colors[index],
    },
    friction: 0.005,
    restitution: 0.3,
  });
  World.add(world, fruit);
  return { body: fruit, index: index };
}
// フルーツを落とす関数（位置をランダム化）
function dropFruit() {
  let xPosition = Math.random() * 600; // x座標をランダムにする
  let fruit = createFruit(currentFruitIndex, xPosition, 0);
  fruitsInGame.push(fruit);
  generateFruit();
}

// ゲームオーバー判定（修正）
function checkGameOver() {
  let isGameOver = fruitsInGame.some((fruit) => fruit.body.position.y < 0);

  if (isGameOver) {
    document.getElementById("game-over").style.display = "block";
    Engine.clear(engine);
    Render.stop(render);
  }
}

// ゲームループでゲームオーバーをチェック
Events.on(engine, "afterUpdate", checkGameOver);

function startGame() {
  generateFruit(); // 初期フルーツを生成
  Engine.run(engine);
  Render.run(render);
}

// ボタンイベントリスナー
document.getElementById("drop-button").addEventListener("click", dropFruit);

startGame();
