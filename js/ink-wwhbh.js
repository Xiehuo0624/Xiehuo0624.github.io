/* ===== WWHBH: 实时晕染 =====
 *
 * 一张灰色的、像墨在纸上毛细扩散的图，与 js/audio-wwhbh.js 的聆听状态同步：
 *
 *   running（正在聆听）→ 从左下屏幕外开始向外晕染，90 秒铺满；
 *                       铺满的那一刻，这一轮的墨**全部留下**变成永久痕迹，
 *                       紧接着换一张全新的、从零再铺一遍 —— **每 90 秒一轮**，
 *                       一轮轮叠上去，最后变成纯黑；
 *   idle（按了关闭）  → 冻住，画面与已累计的时长都停在原处；
 *   再次开始          → 冻住的那张**一边扩散一边褪掉**（3 秒），
 *                       同时新的一张立刻在底下开始长。
 *                       **重启不留下痕迹** —— 留痕迹是「跑满 90 秒」的奖励，
 *                       由上面的周期负责，不由停止/重启负责。
 *
 * 「每次结果不能相同」：噪声种子取自 crypto.getRandomValues()，
 * 首次、每次重新开始，拿到的都是一张从没出现过的图。
 * （改窗口尺寸不会换图 —— 那只是把同一张图按新尺寸重新光栅化。）
 *
 * ── 墨深：单轮有上限，累积没有上限 ──
 * 作者的两次要求是连贯的：先「取消浓度上限」，再「第一遍就有纯黑色不是我想要的，
 * 我是想要在一次次晕染后变成了纯黑」，最后明确「我要的不是停止重启一遍遍覆盖，
 * 我要的是每 90 秒一遍遍覆盖」。所以：
 *   · 单轮最深只到 DARK_MAX —— 第一遍绝不出现纯黑；
 *   · 每跑满 90 秒，这一轮并入累积层 base（永久），换新图再铺一遍；
 *   · 累积用 alpha 合成，渐近逼近纯黑而永不溢出。
 * 最深处的正文会被盖掉，这是有意为之，不是 bug。
 *
 * ── 为什么不是「距离 + 噪声扰动」 ──
 * 第一版把前缘写成「到起点的距离 × 噪声」，结果是一坨圆滚滚的、像一杯水泼上去的
 * 灰块：普通值噪声只能让前缘变毛糙，不能让手指分叉。毛细现象的物理是
 * 「墨在多孔介质里沿渗透率高的通道推进」，所以这里真的解一次输运问题：
 * 先用脊状分形（毛细／树枝／雪花的经典生成法）造一个渗透率场 v(x,y)，
 * 再解程函方程 |∇T| = 1/v，T 就是「前缘第几刻到达这个像素」。
 * 前缘于是自动沿快通道窜出去，通道在哪里分叉手指就在哪里分叉；
 * 与起点不连通的快通道会变成漂在主前缘前面的孤岛 —— 这正是毛细渗流的标志。
 * 渗透率场在极坐标下采样（角度方向频率高、半径方向频率低），
 * 特征因此沿半径拉长，形成放射状的霜花结构。
 *
 * ── 性能 ──
 * 生成一次是所有开销所在（渗透率场 + 程函求解），
 * 之后逐帧循环里只剩「比较 + 平滑」。内部画布 = 视口的 **1/2**
 * （原为 1/3 —— 3.13 倍放大时噪声里接近奈奎斯特的那一档会显成一簇簇
 * 「疙瘩」，作者描述为「像素和色块感」；提高分辨率后同样一档噪声在屏幕上
 * 细了一半，疙瘩自然消失）。
 *
 * ── 旧墨会随时间晕染开来并变浅 ──
 * 已经沉淀进 base 的墨每隔一段时间做一次轻微的扩散（五点拉普拉斯），
 * 扩散是**保量**的：只是把墨铺开，峰值降低、面积增大，所以「变浅」是扩散
 * 自然带来的，不额外减淡。但保量扩散无法阻止墨量随轮次单调增加，因此另有
 * 一条损失通道：每轮 DECAY_PER_CYCLE。两者合起来才有作者要的
 * 「动态平衡」—— 新墨不断加深、旧墨不断摊薄，最终停在一个中间状态，
 * 永远不到纯黑。扩散本身有步数上限（空间上会停住），衰减没有。
 *
 * 注意这条损失通道**是摊进每轮的 15 次扩散步里的**（每步乘 DECAY_PER_STEP），
 * 不在换轮那一帧一次扣掉 —— 后者会让整屏在一帧里掉 8%，作者实测到了
 * 「瞬间全屏阶梯式变浅」。摊开不改变每轮的总量，所以平衡点分毫不动。
 * 生长阶段限制在 ~15fps —— 铺满要 90 秒，60fps 没有任何意义。
 *
 * ── 音频不受影响 ──
 * 本文件与 audio-wwhbh.js 都在主线程，但那件作品的 90 秒延时与反馈
 * 全部由 Web Audio 原生节点构成（无 ScriptProcessor、无 AudioWorklet），
 * 声音跑在音频线程上，这里画图再重也吵不到它。
 *
 * ── 交互 ──
 * position:fixed 铺满视口（不是文档），pointer-events:none 不挡选字与点击。
 */
(function(){
  /* ---------- 时间与尺度 ---------- */
  const GROW_MS   = 90000;   // 铺满用时，与作品的 90 秒延时对齐
  const FRAME_MS  = 66;      // 生长阶段约 15fps
  const FADE_MS   = 3000;    // 重启时整场录音的痕迹溶解掉的时长。
                             // 作者要求「重启也用同一套」：不再是整体均匀淡出，
                             // 而是**一边扩散一边变淡**（见 tick 里的 fading 分支）。
                             // 原为 1500；作者反馈「重开新录制时旧墨水消失速度太快」，
                             // 要求减半 —— 速度减半即时长翻倍。
                             // 注意：这一条与 FADE_DIFFUSE_STEPS 是一对，见下。
  const SCALE     = 2.0;     // 内部画布 = 视口 / SCALE（原 3.0，为消除像素感提高）
  const MIN_W     = 300;
  const MAX_W     = 800;

  /* ---------- 旧墨的随时间扩散与衰减 ---------- */
  const DIFFUSE_K = 0.22;    // 单次扩散步长（五点拉普拉斯）。> 0.25 会不稳定
  const AGE_STEPS_MAX = 15;  // 每轮的扩散步数上限 —— 「空间上停住」。
                             // 原为 60，作者的评语是「随时间晕染开来的效果太明显了，
                             // 需要变为现在的四分之一程度」。
                             // 注意扩散的两个量不是同一个比例：
                             //   每轮转移的墨量（＝变浅多少）∝ 步数  → 60→15 即 ÷4 ✓
                             //   摊开的距离 ∝ √步数                   → 只能 ÷2
                             // 半径 ≈ sqrt(2 × 0.22 × 15) ≈ 2.6 内部像素
                             // （屏幕上约 5px）
  /* 旧墨每隔多久扩散一步。**必须声明在 AGE_STEPS_MAX 之后** —— 它引用后者，
     而 const 有暂时性死区，写反了会在脚本加载时直接抛
     「Cannot access 'AGE_STEPS_MAX' before initialization」，
     而 `node --check` 只查语法、查不出这个（本轮就踩了一次）。

     值由「一轮的总时长 ÷ 每轮步数」推出，不写死 —— 作者要求「在下一轮铺满
     屏幕的时候完成上一轮晕染，这样上一轮和下一轮在时间上是没有间隙的」。
     也就是：上一轮沉淀下来的墨，在下一轮铺满的全过程中一直在极缓慢地摊开，
     第 15 步正好落在下一次换轮的那一刻。
     原为写死的 1500ms（15 步 × 1.5s = 22.5 秒就走完，剩下 67.5 秒什么都不发生）。
     推导式的好处：以后改 AGE_STEPS_MAX，节奏自动跟着变，不会再出现空档。 */
  const AGE_STEP_MS = GROW_MS / AGE_STEPS_MAX;   // 90000 / 15 = 6000ms
  const FADE_DIFFUSE_STEPS = 1;  // 重启溶解期间每帧额外做几步扩散。
                                 // **和 FADE_MS 是一对，必须一起看**：溶解期间
                                 // 每帧都画（不受 FRAME_MS 限制），所以
                                 //   总扩散步数 = 帧数 × 本值，而帧数 ∝ FADE_MS。
                                 // FADE_MS 翻倍时本值要减半，总扩散量才不变 ——
                                 // 整个溶解过程就是原速的一半（真正的慢放），
                                 // 而不是「褪色变慢、墨却摊得更开」。
                                 // 若想让墨在消失时摊得更开，把本值留在 2。
  /* 每轮一次的损失通道。**没有它就到不了「永远不到纯黑」**：
     扩散保量，而每 90 秒又叠一层新的进来，只增不减必然变黑。
     固定点 b = d·L / (1 − d + d·L)，取 d = 0.92、L = 0.5 → b ≈ 0.85，
     即最深稳定在 85% 左右，永远不到纯黑。 */
  const DECAY_PER_CYCLE = 0.92;
  /* 上面那 0.92 **不再在换轮那一帧一次做完**，而是摊进本轮的每 AGE_STEPS_MAX
     次扩散步里，每步乘一次本值。原因是作者实测到的现象：换轮那一瞬间整屏会
     「阶梯式变浅」一下 —— 那一帧屏幕上原本是「旧墨 ⊕ 刚跑满的这一轮」，紧接着
     被整体乘了 0.92，于是全画面在一帧里掉 8%（实测最深像素 127 → 116，分毫不差）。
     那不是动画，是一次乘法，锁多少帧率都盖不住。
     摊开之后：每步只掉 0.554%，15 步合起来仍然是 0.92 ——
     **长期平衡点、最深能到多少，一点都没变**，变的只是「什么时候减」。

     **必须声明在 AGE_STEPS_MAX 与 DECAY_PER_CYCLE 之后** —— 它引用两者，
     而 const 有暂时性死区，写反了会在脚本加载时直接抛
     「Cannot access 'AGE_STEPS_MAX' before initialization」（上一轮踩过一次）。 */
  const DECAY_PER_STEP = Math.pow(DECAY_PER_CYCLE, 1 / AGE_STEPS_MAX);  // ≈ 0.99446

  /* 前缘过渡带宽度（arrival 单位）。直接决定「模糊」与「看得见手指」的平衡：
     0.20（屏幕上约 180px）时手指被彻底糊成一片均匀渐变，实测看不见。 */
  const SOFT      = 0.09;
  /* 生长终点 = 1 + SOFT。arrival 归一化到最大值为 1，所以 growth 走到
     1 + SOFT 时最远那像素的 e 恰好 = 1（刚好完全上墨）。 */
  const GROW_TO   = 1 + SOFT;

  /* ---------- 渗透率场 ---------- */
  const ANG_K     = 7.0;     // 角度方向频率（越大，放射状手指越密、越细）。
                             // 原为 10 —— 作者在第一轮早期看到的是「一排长度、宽度
                             // 都均匀的细长针刺」，降到 7 让手指更少更宽
  const ANG_JITTER= 0.6;     // 角度抖动，破「海胆」式完全对称。
                             // 调到 1.2 以上会把径向通道彻底打散，变成一团云雾
  const RAD_K     = 1.15;    // 半径方向频率（越小，手指沿半径拉得越长）。
                             // 原为 0.8（拉得过长），提到 1.15 让手指变短
  const V_BASE    = 0.3;     // 通道渗透率下限
  const V_GAIN    = 8.0;     // 通道对比：v = 0.3 + 8·r²。原为 10；对比过高时前缘
                             // 会被切成一根根独立的长针
  /* 角度调制：**这是打破「针刺均匀」的关键**，不是 ANG_K/RAD_K。
     实测：只改 ANG_K/RAD_K 而不加调制，前缘依然是一整排等长等宽的扇形针；
     加了调制之后手指才变得长短不一、粗细不一、并且弯曲。
     做法是把渗透率再乘一个低频角度包络（e ∈ [0,1]）：
       r *= (ANG_ENV_LO + ANG_ENV_HI · e)
     频率 0.72 是试出来的 —— 更疏（0.42）会把整排手指抹成一两道大瓣，
     更密则接近没有调制。 */
  const ANG_ENV_F = 0.72;    // 角度调制频率
  const ANG_ENV_D = 0.30;    // 调制沿半径的变化率
  const ANG_ENV_LO= 0.50;    // 包络下限
  const ANG_ENV_HI= 1.00;    // 包络幅度 → 乘数在 0.5…1.5 之间
  const EIK_ROUNDS= 6;       // fast sweeping 轮数（6 轮已收敛，12/24 轮只差 0.3%）

  /* ---------- 墨深的形状：域扭曲的 fBm（不是脊状场） ----------
     原先用脊状多重分形，因为它是毛细／血管／闪电的经典生成法。但脊状场的
     天性就是**把脊连成一张网**，所以无论怎么调都呈现为连续的深色脉络 ——
     作者的评语是「深色的晕染太有规律、太连续了」。改用域扭曲的 fBm：
     先用一个低频噪声把采样坐标推歪，再取 fBm，得到的是大小不一、互不连通的
     斑块，没有贯穿全图的脉络。再用一条对比曲线把大部分区域压浅、少数压深。

     另外，墨深**必须用笛卡尔采样**，不能复用渗透率场：渗透率场为了做放射状
     手指必须用极坐标采样，5 个倍频叠上去之后最高倍频沿圆周要走上万周期，
     远超像素极限 —— 那是走样。在低浓度下看不出来，一旦按全对比度显影，
     整页会变成一圈圈木纹（实测）。纹理归纹理、流动归流动。 */
  const D_WARP    = 0.08;    // 域扭曲强度。**这个值不能大**：调到 0.35 时等值线会被
                             // 拉成一条条触手状突起，作者的评语是「边缘像触手一样」。
                             // 0.08 只用来打散规律性，不改变形状语言。
  const D_LO      = 0.40;    // 对比曲线下限：低于此值算最浅
  const D_HI      = 0.64;    // 上限：高于此值算最深

  /* ---------- 单轮深浅，与「每 90 秒叠一层」 ----------
     单轮最深只到 DARK_MAX —— 第一遍绝不出现纯黑。每跑满 90 秒，
     这一轮按 SOAK 并入累积层 base，然后换新图再铺一遍。
     alpha 合成：base ← base + 当前层 × SOAK × (1 − base)，
     渐近逼近 1、永不溢出。SOAK = 1 表示这一轮的墨全部留下。
     实测（SOAK=1、单轮最深 0.68）每轮的峰值：
       1 轮 68% → 2 轮 90% → 3 轮 97% → 4 轮 99%。 */
  /* ---------- 单轮的面积配比与深浅带 ----------
     作者给的是**面积指标**，不是形容词：「百分之 70 面积浅、百分之 10 留白、
     百分之 20 深」。所以分档不能靠调噪声参数去碰，必须**按百分位切**：
     先算出一张分档用的场，求它的 p10 与 p80，再按位置切三档 —— 面积比例
     精确成立，与噪声本身的分布无关（fBm 的分布并不是均匀的）。

     注意「留白」不是数学意义上的 0：作者明确「我的留白要求不是数学意义上留白，
     而是比较淡」。所以第三档是一层很淡的底子（1%–3%），不是空白。 */
  const PALE_FRAC = 0.10;    // 最淡的一档所占面积
  const DARK_FRAC = 0.20;    // 深色面积（其余 70% 为浅色）
  /* 三档**连续**映射，档与档之间没有跳变 —— 作者要的是「柔和浸开」：
     深色块从块心往外逐渐变淡，而不是一块硬边。三段依次是
       rmn…p10  → PALE_MIN…PALE_MAX      （最淡 10%）
       p10…p80  → PALE_MAX…LIGHT_MAX     （浅 70%）
       p80…rmx  → LIGHT_MAX…DARK_MAX     （深 20%，块心最深）
     每段的端点与相邻段相等，所以整体是一条连续单调曲线。 */
  const PALE_MIN  = 0.010;   // 最淡档：很淡，但看得见（作者确认保持）
  const PALE_MAX  = 0.030;
  const LIGHT_MAX = 0.260;   // 浅色带最深
  const DARK_MAX  = 0.500;   // 深色带最深（作者：由 0.68 减到 0.50 左右）
  /* 两条带用两个不同的场，这是作者说的「组合 ver2 的深色部分和 ver3 的浅色部分」：
       · 浅色带 ← 柔和场（4 倍频、persistence 0.45）：平缓的水渍底子，没有硬形状
       · 深色带 ← 颗粒场（6 倍频、persistence 0.68）：毛糙的墨块
     分档依据用两者的均值。 */
  const L_OCT = 4, L_PERS = 0.45;
  /* 手机端减弱：小屏上内部画布宽度钳在 300–800（MIN_W / MAX_W），同样的区块占比更大、
     看起来更重，所以整体压淡一点（作者：手机上减弱一点）。 */
  const MOBILE_MAXW = 768, MOBILE_SCALE = 0.72;
  const D_OCT = 6, D_PERS = 0.68;   // persistence 0.62 → 0.68：高频权重更大，
                                    // 深色块更碎、更多小点（作者要求）
  const SOAK      = 1.0;     // 每轮有多少比例永久留下

  let cv = null, ctx = null, img = null;
  let cw = 0, ch = 0, N = 0;
  let base = null;           // Float32Array(N)：渗进纸里的累积墨量（0..1），跨轮次保留
  let baseTmp = null;        // 扩散用的双缓冲（避免就地更新的方向偏置）
  let baseInk = false;       // base 里是否已经有墨（免得为了判断去扫整个数组）
  let ageSteps = 0;          // 本轮已经扩散了多少步（预算由 acc 推出，见 tick）
  let fading = false;        // 重启时整层正在「扩散 + 变淡」地溶解
  let fadeT = 0;
  let baseAlpha = 1;         // 累积层的整体透明度（只在溶解期间 < 1）
  let field = null;          // { arrival: Float32Array, density: Uint8Array }
  let seed = 0;

  let mode = 'off';          // off | grow | hold
  let growth = 0;            // 前缘位置：0 = 还在屏幕外，1 = 铺满
  let acc = 0;               // 已累计的聆听时长（只在页面可见时累加）
  let last = 0, lastAcc = 0, lastDraw = 0;
  let raf = 0;
  let signal = null;         // 上一次收到的开关信号，用来忽略重复调用
  let reduce = null;

  /* ---------- 值噪声 ----------
     格点随机 + 平滑插值。格点数一律取 2 的幂，取模用位与。 */
  function makeNoise(s, grid){
    const r = new Float32Array(grid * grid);
    let x = s >>> 0;
    for (let i = 0; i < r.length; i++){
      x = (x * 1664525 + 1013904223) >>> 0;
      r[i] = x / 4294967296;
    }
    const g = grid, m = grid - 1;
    return function(u, v){
      const fx = u * g, fy = v * g;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const ix0 = x0 & m, ix1 = (ix0 + 1) & m;
      const iy0 = y0 & m, iy1 = (iy0 + 1) & m;
      const r0 = iy0 * g, r1 = iy1 * g;
      const a = r[r0 + ix0], b = r[r0 + ix1], c = r[r1 + ix0], d = r[r1 + ix1];
      const p = a + (b - a) * sx, q = c + (d - c) * sx;
      return p + (q - p) * sy;
    };
  }

  /* 脊状多重分形 —— 毛细／树枝／雪花的经典生成法。
     每倍频取 1-|2n-1| 得到「脊」并平方锐化，再乘上一倍频的值：
     细节只长在已有的脊上，于是形成大分叉带小分叉的层级结构。
     普通值噪声做不到这一点，它只会给出圆滚滚的团块。 */
  function ridged(ns, u, v, oct){
    let sum = 0, amp = 1, f = 1, norm = 0, prev = 1;
    for (let o = 0; o < oct; o++){
      let n = ns[o](u * f, v * f);
      n = 1 - Math.abs(2 * n - 1);
      n *= n;
      n *= 0.35 + 0.65 * prev;
      prev = n;
      sum += n * amp;
      norm += amp; amp *= 0.5; f *= 2;
    }
    return sum / norm;
  }

  /* 普通 fBm —— 只用于墨深的形状（见上方说明） */
  function fbm(ns, u, v, oct, pers){
    let sum = 0, amp = 1, f = 1, norm = 0;
    for (let o = 0; o < oct; o++){
      sum += ns[o](u * f, v * f) * amp;
      norm += amp; amp *= pers; f *= 2;
    }
    return sum / norm;
  }

  /* ---------- 程函方程 |∇T| = 1/v ----------
     fast sweeping：四个方向轮流扫，每扫一遍信息就横穿整个网格一次。 */
  function solve(speed, ox, oy){
    const INF = 1e18;
    const T = new Float32Array(N).fill(INF);
    const S = new Float32Array(N);
    for (let i = 0; i < N; i++) S[i] = 1 / speed[i];

    // 种子：画面内靠近左下角的那一小段弧。
    // 半径必须由「画面内离起点最近的像素有多远」算出来，不能写死：
    // 起点探出屏幕外 5%，画布越大这段距离越大 —— 320px 画布时是 18px，
    // 480px 画布时是 27px。写死 26 会让一颗种子都种不下去，
    // 整场求解全是 INF，归一化后整屏 arrival = 1（实测就是这样崩的：
    // 第一帧整屏同时上墨、然后彻底不动）。
    let dmin = Infinity;
    for (let y = 0; y < ch; y++){
      const dy = y - oy;
      for (let x = 0; x < cw; x++){
        const dx = x - ox;
        const dp = Math.sqrt(dx * dx + dy * dy);
        if (dp < dmin) dmin = dp;
      }
    }
    const seedR = dmin * 1.5 + 2;
    for (let y = 0; y < ch; y++){
      const dy = y - oy;
      for (let x = 0; x < cw; x++){
        const dx = x - ox;
        const dp = Math.sqrt(dx * dx + dy * dy);
        if (dp <= seedR) T[y * cw + x] = dp;
      }
    }

    for (let round = 0; round < EIK_ROUNDS; round++){
      for (let dir = 0; dir < 4; dir++){
        const revY = (dir & 1) !== 0, revX = (dir & 2) !== 0;
        for (let yi = 0; yi < ch; yi++){
          const y = revY ? ch - 1 - yi : yi, row = y * cw;
          for (let xi = 0; xi < cw; xi++){
            const x = revX ? cw - 1 - xi : xi;
            const i = row + x;
            let a = INF, b = INF;
            if (x > 0)       { const t = T[i - 1];  if (t < a) a = t; }
            if (x < cw - 1)  { const t = T[i + 1];  if (t < a) a = t; }
            if (y > 0)       { const t = T[i - cw]; if (t < b) b = t; }
            if (y < ch - 1)  { const t = T[i + cw]; if (t < b) b = t; }
            if (a === INF && b === INF) continue;
            const s = S[i];
            let t;
            if (a === INF) t = b + s;
            else if (b === INF) t = a + s;
            else {
              const diff = a - b;
              if (diff >= s) t = b + s;
              else if (-diff >= s) t = a + s;
              else t = (a + b + Math.sqrt(2 * s * s - diff * diff)) * 0.5;
            }
            if (t < T[i]) T[i] = t;
          }
        }
      }
    }

    // 归一化到 0..1，并**先减去最小值**：离起点最近的可见像素本来就有
    // 约 18px 行程（起点在屏幕外），不减掉的话它归一化后不是 0 而是一个
    // 正数，开头几秒的浓度被四舍五入成 0，看起来像没反应。
    let mn = INF, mx = -INF;
    for (let i = 0; i < N; i++){
      const t = T[i];
      if (t >= INF) continue;
      if (t < mn) mn = t;
      if (t > mx) mx = t;
    }
    const span = (mx - mn) > 1e-9 ? (mx - mn) : 1;
    for (let i = 0; i < N; i++) T[i] = (T[i] >= INF ? 1 : (T[i] - mn) / span);
    return T;
  }

  function newSeed(){
    try {
      if (window.crypto && crypto.getRandomValues){
        const a = new Uint32Array(1);
        crypto.getRandomValues(a);
        if (a[0]) return a[0];
      }
    } catch(e){}
    return ((Math.random() * 4294967296) >>> 0) || 1;
  }

  /* ---------- 画布尺寸 ---------- */
  function resize(){
    const vw = Math.max(1, window.innerWidth || 1);
    const vh = Math.max(1, window.innerHeight || 1);
    let w = Math.round(vw / SCALE);
    if (w < MIN_W) w = MIN_W;
    if (w > MAX_W) w = MAX_W;
    const h = Math.max(1, Math.round(w * vh / vw));
    if (w === cw && h === ch) return false;
    cw = w; ch = h; N = w * h;
    cv.width = w; cv.height = h;
    img = ctx.createImageData(w, h);   // 零初始化：RGB=0（黑墨），alpha=0
    base = new Float32Array(N);        // 尺寸一变就重建累积层（见 resize 处理器注释）
    baseTmp = new Float32Array(N);
    ageSteps = 0; fading = false; baseAlpha = 1;
    return true;
  }

  /* ---------- 生成一张新图 ---------- */
  function generate(){
    const rid  = [8, 16, 32, 64, 128].map(function(g, i){ return makeNoise(seed + i * 977, g); });
    const jit  = makeNoise(seed ^ 0x700d0000, 4);
    const envN = makeNoise(seed ^ 0x0badf00d, 8);   // 角度调制包络（见 ANG_ENV_* 的注释）

    // 起点落在屏幕外左下：晕染是从看不见的地方漫进来的。
    // 只探出去 5% —— 探太多的话画面内离起点最近的像素到达时刻已经很晚，
    // 开头十几秒什么都看不见，看起来像坏掉了。
    const ox = -0.05 * cw, oy = ch * 1.05;
    const maxD = Math.sqrt((cw - ox) * (cw - ox) + oy * oy) || 1;

    const speed = new Float32Array(N);
    for (let y = 0; y < ch; y++){
      const dy = y - oy;
      for (let x = 0; x < cw; x++){
        const dx = x - ox;
        const d = Math.sqrt(dx * dx + dy * dy) / maxD;
        // 角度抖动：破掉完全对称，让径向手指扭动、分叉
        const ang = Math.atan2(dy, dx) + (jit(x / cw, y / cw) - 0.5) * ANG_JITTER;
        let r = ridged(rid, ang * ANG_K, d * RAD_K, rid.length);
        // 角度调制：让手指长短、粗细不一，去掉「一排等长细针」的规律感
        r *= ANG_ENV_LO + ANG_ENV_HI * envN(ang * ANG_ENV_F + 0.5, d * ANG_ENV_D);
        speed[y * cw + x] = V_BASE + V_GAIN * r * r;
      }
    }

    const arrival = solve(speed, ox, oy);
    const depthScale = ((window.innerWidth || 9999) <= MOBILE_MAXW) ? MOBILE_SCALE : 1;

    /* 墨深：按百分位切三档（浅 / 留白 / 深）。
       两张场：柔和场给浅色带，颗粒场给深色带。 */
    const texW = [4, 8].map(function(g, i){ return makeNoise(seed ^ (0x11111111 + i * 313), g); });
    const texL = [4, 8, 16, 32].map(function(g, i){ return makeNoise(seed ^ (0x0a0a0a0a + i * 131), g); });
    const texD = [4, 8, 16, 32, 64, 128].map(function(g, i){ return makeNoise(seed ^ (0x2545f491 + i * 131), g); });

    const raw = new Float32Array(N);     // 分档依据
    const sof = new Float32Array(N);     // 柔和场（浅色带内部的起伏）
    let rmn = Infinity, rmx = -Infinity;
    for (let y = 0; y < ch; y++){
      const v = y / cw;                  // 除以 cw 而非 ch：保持各向同性
      for (let x = 0; x < cw; x++){
        const u = x / cw;
        const wx = (texW[0](u, v) - 0.5) * D_WARP;
        const wy = (texW[1](u, v) - 0.5) * D_WARP;
        const su = u + wx, sv = v + wy;
        const a = fbm(texL, su, sv, L_OCT, L_PERS);
        const b = fbm(texD, su, sv, D_OCT, D_PERS);
        const i2 = y * cw + x;
        sof[i2] = a;
        const m = 0.5 * a + 0.5 * b;     // 分档依据 = 两场的均值
        raw[i2] = m;
        if (m < rmn) rmn = m;
        if (m > rmx) rmx = m;
      }
    }

    // 直方图求 p10 与 p80 —— 面积比例由此精确成立
    const BINS = 512;
    const hist = new Int32Array(BINS);
    const scale = (rmx - rmn) > 1e-9 ? (BINS - 1) / (rmx - rmn) : 0;
    for (let i2 = 0; i2 < N; i2++){
      let b = ((raw[i2] - rmn) * scale) | 0;
      if (b < 0) b = 0; else if (b >= BINS) b = BINS - 1;
      hist[b]++;
    }
    const needPale = N * PALE_FRAC, needDark = N * (1 - DARK_FRAC);
    let acc2 = 0, binP10 = 0, binP80 = BINS - 1;
    for (let b = 0; b < BINS; b++){
      acc2 += hist[b];
      if (acc2 < needPale) binP10 = b + 1;
      if (acc2 < needDark) binP80 = b + 1;
    }
    const p10 = rmn + (binP10 + 0.5) / scale;
    const p80 = rmn + (binP80 + 0.5) / scale;
    const spanP = (p10 - rmn) > 1e-9 ? (p10 - rmn) : 1;
    const spanL = (p80 - p10) > 1e-9 ? (p80 - p10) : 1;
    const spanD = (rmx - p80) > 1e-9 ? (rmx - p80) : 1;

    const density = new Uint8Array(N);
    for (let i2 = 0; i2 < N; i2++){
      const m = raw[i2];
      let depth;
      if (m < p10){
        // 最淡的一层底子（不是 0 —— 作者要的「留白」是比较淡）
        let t = (m - rmn) / spanP;
        t = t < 0 ? 0 : (t > 1 ? 1 : t);
        depth = PALE_MIN + (PALE_MAX - PALE_MIN) * (t * t * (3 - 2 * t));
      } else if (m < p80){
        // 浅色带：主体渐变 + 柔和场给的缓慢起伏（水渍感）。
        // 起伏乘一个两端为 0 的包络，保证与相邻两档在端点处严格衔接。
        let t = (m - p10) / spanL;
        t = t < 0 ? 0 : (t > 1 ? 1 : t);
        const local = (sof[i2] - (p10 + p80) * 0.5) / spanL;
        const cl = local < -0.5 ? -0.5 : (local > 0.5 ? 0.5 : local);
        const env = 4 * t * (1 - t);                     // 两端 0，中间 1
        let u = t + cl * env * 0.35;
        u = u < 0 ? 0 : (u > 1 ? 1 : u);
        depth = PALE_MAX + (LIGHT_MAX - PALE_MAX) * (u * u * (3 - 2 * u));
      } else {
        // 深色带：从 LIGHT_MAX **连续**升到 DARK_MAX，没有跳变 —— 这就是
        // 「柔和浸开」：块心最深、往外逐渐变淡，边界处正好等于 LIGHT_MAX，
        // 与浅色带无缝。t^0.65 让深色更快压下去，不至于只有极少数像素够深。
        let t = (m - p80) / spanD;
        t = t < 0 ? 0 : (t > 1 ? 1 : t);
        depth = LIGHT_MAX + (DARK_MAX - LIGHT_MAX) * Math.pow(t, 0.65);
      }
      density[i2] = (depth * depthScale * 255) | 0;
    }

    return { arrival: arrival, density: density };
  }

  /* ---------- 画一帧 ----------
     叠两层：沉淀下来的旧墨（base，可能正在溶解）+ 正在长的新图。 */
  /* 某一层在某像素的当前墨量（0..1，已含前缘的浅淡） */
  function layerAt(arrival, densityArr, g, i){
    let e = (g - arrival[i]) * (1 / SOFT);
    if (e <= 0) return 0;
    if (e > 1) e = 1;
    const sm = e * e * (3 - 2 * e);
    return sm * (0.42 + 0.58 * sm) * densityArr[i] * (1 / 255);
  }

  /* 把当前这一轮按 SOAK 的比例并进累积层 —— 这就是「渗进纸里」。
     alpha 合成而非相加：永远渐近逼近 1，不会溢出。 */
  function bake(){
    if (!field) return;
    const ca = field.arrival, cd = field.density;
    for (let i = 0; i < N; i++){
      const lay = layerAt(ca, cd, growth, i) * SOAK;
      if (lay > 0){ base[i] = base[i] + lay * (1 - base[i]); baseInk = true; }
    }
  }

  /* 一次或多次扩散步。边界用「反射」而不是零，避免墨往边上漏、画面变白。
     双缓冲：读 a 写 b，再交换 —— 就地更新会有方向偏置（总是往一个角拖）。

     第二个参数是「每一步顺带乘的衰减」，默认 1（不减）。
     · 旧墨随时间晕染时传 DECAY_PER_STEP —— 每轮的损失通道就摊在这里；
     · 重启溶解时传默认的 1：那一层反正马上就要清零，不必再减。 */
  function diffuseBase(steps, decay){
    if (!baseInk || !baseTmp) return;
    const d = decay === undefined ? 1 : decay;
    for (let s = 0; s < steps; s++){
      const a = base, b = baseTmp;
      for (let y = 0; y < ch; y++){
        const row = y * cw;
        const up = y > 0 ? row - cw : row;
        const dn = y < ch - 1 ? row + cw : row;
        for (let x = 0; x < cw; x++){
          const i = row + x;
          const c = a[i];
          const l = x > 0 ? c - (c - a[i - 1]) : c;          // 反射：贴边时取自己
          const r = x < cw - 1 ? a[i + 1] : c;
          b[i] = (c + DIFFUSE_K * (l + r + a[up + x] + a[dn + x] - 4 * c)) * d;
        }
      }
      base = b; baseTmp = a;                                  // 交换缓冲
    }
  }

  /* 一次补上 count 轮的衰减 —— **只用在「一次跨过多轮」的补算路径上**。
     正常换轮（n = 1）不调用它：那一轮的损失通道由本轮的 15 次扩散步分摊。
     页面不可见时那些轮没有扩散步可以摊，回前台补齐时只能在这里一次性扣掉；
     count 为 0 时直接返回。 */
  function decayBaseCycles(count){
    if (!baseInk || count <= 0) return;
    const f = Math.pow(DECAY_PER_CYCLE, count);
    for (let i = 0; i < N; i++) base[i] *= f;
  }

  function paint(){
    const d = img.data;
    const ca = field.arrival, cd = field.density;
    const g = growth;
    for (let i = 0, p = 3; i < N; i++, p += 4){
      // 1) 沉淀下来的旧墨（每轮一次衰减；溶解期间整体再乘 baseAlpha）
      let a = baseAlpha === 1 ? base[i] : base[i] * baseAlpha;
      // 2) 当前这一轮叠上去
      const lay = layerAt(ca, cd, g, i);
      if (lay > 0) a = a + lay * (1 - a);
      d[p] = (a * 255) | 0;
    }
    ctx.putImageData(img, 0, 0);
  }

  /* ---------- 循环 ---------- */
  function ensureLoop(){
    if (raf) return;
    last = 0; lastAcc = 0;
    raf = requestAnimationFrame(tick);
  }
  function stopLoop(){
    if (raf){ cancelAnimationFrame(raf); raf = 0; }
  }

  function tick(now){
    raf = requestAnimationFrame(tick);
    const dt = last ? now - last : 0;
    last = now;

    // 页面不可见时 rAF 根本不再触发，所以这里不会执行；回到前台的第一帧
    // now-lastAcc 就是整段隐藏时长。作者要求「后台也计时」，因此不做暂停，
    // 让 acc 自然跨过那一段（跨过几轮由下面的 n 补齐）。
    if (mode !== 'grow'){ stopLoop(); return; }   // hold：画面已静止

    if (!lastAcc) lastAcc = now;
    acc += now - lastAcc;
    lastAcc = now;

    if (fading){
      // 重启：整层「一边扩散一边变淡」地溶解掉 —— 作者要求重启也用同一套晕染，
      // 而不是整体均匀淡出。
      fadeT += dt;
      let fp = fadeT / FADE_MS;
      if (fp > 1) fp = 1;
      baseAlpha = 1 - fp * fp * (3 - 2 * fp);
      diffuseBase(FADE_DIFFUSE_STEPS);
      if (fp >= 1){
        fading = false; baseAlpha = 1;
        if (base) base.fill(0);
        baseInk = false; ageSteps = 0;
      }
    } else if (baseInk){
      /* 旧墨随时间轻轻摊开一点。只对已经沉淀下来的 base 生效 ——
         正在长的那一轮保持清晰（作者：只有沉淀下来的旧墨会变）。
         每步顺带乘 DECAY_PER_STEP：每轮那份损失通道就摊在这 15 步里，
         不再于换轮那一帧一次性扣掉（见 DECAY_PER_STEP 的注释）。

         **本轮的预算按 acc 算，不按「距上次多少毫秒」算。** 这是实测出来的：
         用固定间隔时，每一步都会被帧量化往后拖几毫秒（6000 变成 6000~6017），
         15 步累计下来就超过了 90000ms，于是第 15 步永远落在换轮之后、被换轮
         截掉 —— 每轮实际只摊成 14 步，损失通道只减掉 7.5% 而不是 8%。
         0.6% 看着小，平衡点却整体偏深：实测全画面均值从 168 涨到 185。
         acc 就是换轮用的那个时钟，用它算，第 k 步落在 acc ≥ k × AGE_STEP_MS，
         第 15 步正好落在换轮那一帧（那一帧里先扩散、后 bake），一轮不多不少 15 步。
         副作用是少了一个状态变量（原来那个 lastAge 已删掉）。 */
      let due = Math.floor(acc / AGE_STEP_MS);
      if (due > AGE_STEPS_MAX) due = AGE_STEPS_MAX;
      if (due > ageSteps){
        diffuseBase(due - ageSteps, DECAY_PER_STEP);
        ageSteps = due;
      }
    }

    // 生长阶段锁 ~15fps（铺满要 90 秒，60fps 无意义）；
    // 但溶解要跑满帧，否则看得出跳。
    if (now - lastDraw < (fading ? 0 : FRAME_MS)) return;
    lastDraw = now;

    const g = GROW_TO * acc / GROW_MS;
    /* 一轮 90 秒跑满。作者要的是「每 90 秒一遍遍覆盖」，所以这里不是停下来，
       而是：这一轮的墨全部留下 → 换新图 → 从零再铺。
       **这一帧不再做衰减** —— 那正是作者看到的「瞬间全屏阶梯式变浅」：
       上一帧屏幕上还是「旧墨 ⊕ 刚跑满的这一轮」，这一帧被整体乘 0.92，
       于是整屏在一帧里掉 8%。损失通道现在摊在本轮的 15 次扩散步里，
       所以这里只把这一轮的墨留下，屏幕上是 base ⊕ 层 = base，分界处不闪。 */
    if (g >= GROW_TO){
      // 可能一次跨过好几轮（例如刚从后台回来）：补齐相应次数的累积。
      // 用同一张层重复叠加来近似 —— 那些已经过去的轮各自的随机图无法追溯。
      let n = Math.floor(acc / GROW_MS);
      if (n > 20) n = 20;                    // 上限，避免久置后一次算太久
      if (n < 1) n = 1;
      for (let k = 0; k < n; k++) bake();
      // n−1 轮的衰减在这里补：那段时间页面不可见，没有 15 步可以摊。
      // 第 n 轮（也就是刚跑满的这轮）的份额，照常交给下一轮的 15 次扩散步。
      decayBaseCycles(n - 1);
      ageSteps = 0;           // 新一轮，重置本轮的扩散预算（acc 同时归零，两者对齐）
      acc -= n * GROW_MS;
      if (acc < 0) acc = 0;
      seed = newSeed();
      field = generate();
      growth = 0; lastAcc = now;
      paint();
      return;
    }
    growth = g;
    paint();
  }

  /* ---------- 对外 ---------- */
  function initCanvas(){
    cv = document.getElementById('wwhbh-ink-cv');
    if (!cv || !cv.getContext) return false;
    ctx = cv.getContext('2d');
    if (!ctx){ cv = null; return false; }
    resize();
    seed = newSeed();
    field = generate();
    return true;
  }

  function resume(force){
    if (!force && signal === 'on') return;   // 切语言重刷状态行会重复调用，忽略
    signal = 'on';
    if (reduce && reduce.matches) return;    // 系统要求减少动态效果：不启动
    if (!cv && !initCanvas()) return;

    // 停止后再开始 = 洗掉**这一场录音的全部痕迹**（作者要求：不是只洗最新一轮，
    // 而是「洗掉上一次录音到结束的所有轮」），而且要用**扩散**的方式洗掉
    // （作者：「重启也用同一套」）。
    // 做法：先把当前这一轮并进 base，于是 base 就是屏幕上现在的一切；
    // 然后让整层一边扩散一边变淡（tick 的 fading 分支），3 秒后清零。
    // 这样「洗掉整场」和「不用均匀淡出」两个要求同时成立。
    // 注意 ageSteps 归零：新的一轮要重新有扩散预算。
    if (field && !fading && (growth > 0.002 || baseInk)){
      if (growth > 0.002) bake();
      fading = true; fadeT = 0; baseAlpha = 1;
      ageSteps = 0;
      seed = newSeed();
      field = generate();
      growth = 0; acc = 0;
    } else if (!field){
      seed = newSeed(); field = generate(); growth = 0; acc = 0;
    }
    lastAcc = 0; lastDraw = 0;
    mode = 'grow';
    ensureLoop();
  }

  function pause(){
    if (signal === 'off') return;
    signal = 'off';
    if (mode === 'grow' || mode === 'hold'){ mode = 'hold'; stopLoop(); }
  }

  function blank(){
    stopLoop();
    mode = 'off'; growth = 0; acc = 0;
    lastAcc = 0; lastDraw = 0;
    field = null;
    if (base) base.fill(0);            // 「减少动态效果」是重置，不是暂停
    fading = false; baseAlpha = 1; ageSteps = 0;
    baseInk = false;
    if (ctx) ctx.clearRect(0, 0, cw, ch);
  }

  App.wwhbhInk = {
    /** 正在聆听：开始生长；若屏幕上已有图，先交给淡出层再换新的 */
    resume: resume,
    /** 停止：冻住当前画面 */
    pause: pause
  };

  /* 系统「减少动态效果」变化时即时生效 */
  if (window.matchMedia){
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onReduceChange = function(e){
      if (e.matches){ blank(); }
      else if (signal === 'on'){ resume(true); }
    };
    if (reduce.addEventListener) reduce.addEventListener('change', onReduceChange);
    else if (reduce.addListener) reduce.addListener(onReduceChange);
  }

  /* 改窗口尺寸：同一张图按新尺寸重新光栅化，不换种子（那不是「重新开始」）。
     移动端地址栏收放会不停改 innerHeight，所以要挡住「只变了一点点高度」
     的那种抖动 —— 否则滚动时每 350ms 就重做一次生成（含程函求解）。
     淡出层的数组是旧尺寸，尺寸一变就直接丢掉它（少见，且只影响一次淡出）。 */
  let rt = 0;
  function targetSize(){
    const vw = Math.max(1, window.innerWidth || 1);
    const vh = Math.max(1, window.innerHeight || 1);
    let w = Math.round(vw / SCALE);
    if (w < MIN_W) w = MIN_W;
    if (w > MAX_W) w = MAX_W;
    return { w: w, h: Math.max(1, Math.round(w * vh / vw)) };
  }
  window.addEventListener('resize', function(){
    if (!cv) return;
    clearTimeout(rt);
    rt = setTimeout(function(){
      const t = targetSize();
      if (t.w === cw && Math.abs(t.h - ch) < 24) return;   // 抖动，忽略
      const keep = growth;
      // 尺寸变了：累积层按新尺寸重建（等于清零）。旋转屏幕会丢掉已积累的墨 ——
      // 少见，且比留着错位的累积层好。
      // 褪色层的数组是旧尺寸，尺寸一变就丢掉（少见，只影响一次褪色）
      if (resize()){ baseInk = false; field = generate(); growth = keep; paint(); }
    }, 350);
  });
})();
