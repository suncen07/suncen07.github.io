# BirdScope 整体讲解

更新：2026-11-10。依据是本目录实际 notebook 源码、保存的输出、预测 CSV、训练日志和审计 JSON。本次整理没有重新训练模型，也没有执行最终 Test。

> **范围说明**：本文详细讲解当前目录已有的 DL 实验。全组 report 的主题是两种传统 CV、DL 与 VLM 的跨方法比较；它按 [REPORT_PLAN.md](report/REPORT_PLAN.md) 重新组织，只填现有 DL 证据，其他部分留空。本文的 DL 内部结论不是全组比较结论。

## 1. 这个项目解决什么问题

输入一张自然场景中的鸟类图片，输出每只鸟的位置框和置信度，并通过框的数量估计鸟数。只有一个前景类别 `bird`，没有物种分类、实例分割或追踪。当前目录覆盖的是小组项目的 **Methodology C：预训练深度学习检测**。两条真正不同的模型路线是 YOLO26n 与 Faster R-CNN ResNet50-FPN；384/512/640 分辨率、tiling 和 fusion 是推理策略对照，不能计为新的独立架构。

主要研究问题：怎样在整体 AP、误检、计数误差和推理速度之间选择模型？小鸟在噪声下是否呈现与整体成绩不同的表现？局部切块放大能否带来有用收益？

## 2. 统一架构：文件如何配合

```text
datasets/raw/beach_bird_original.zip
  │  原图 + YOLO 标签 + 原有 train/val/test 划分
  ▼
notebooks/BirdScope_CategoryC_Experiments.ipynb
  ├─ 数据检查/解压 → Colab 临时目录 /content/birdscope
  ├─ YOLO 微调 → experiments/yolo26n_512_v1/
  ├─ Faster R-CNN 微调 → experiments/fasterrcnn_r50_fpn_v1/
  └─ 原图/多尺度/切块/融合/噪声推理 → results/ 中的 CSV
         │
         ├─ validation_freeze/：完整图片清单、CSV 哈希与 COCO 核验
         └─ report_package/：10 个配置的统一结果和来源注册表
                  │
methodology/c-deep-learning/src/evaluate.py
  └─ 显式接收 CSV、GT、image_ids，复算 AP/固定指标/计数与分组 recall
                  │
notebooks/BirdScope_Deep_Learning_Analysis.ipynb
  └─ 8 份冻结 CSV → 同鸟配对、尺寸分层、诊断、bootstrap、案例图
                  ▼
results/analysis/ → report/sections/dl_methods.tex + dl_results.tex
                  → report/main.tex / main.pdf（全组框架中已有的DL部分）
```

这是**实验与证据的统一架构**，还不是具备训练、预测、服务部署入口的完整软件产品。

- `datasets/` 保存输入；`experiments/` 保存训练过程及模型状态；`results/` 保存输出和证据，三者职责分开。
- 实验 notebook 75 个 cell，共 6,015 个 source 行，是研究过程记录，包含重复配置、阶段性断言和修复过程。
- 分析 notebook 29 个 cell，共 713 个 source 行；不需要 GPU 或权重，主要读取 ZIP 中的验证数据和保存的预测。
- `source_experiments.ipynb` 与实验 notebook 当前字节完全相同，作为源码快照保留，不重复计数。
- 预测统一为 `image_id,x_min,y_min,x_max,y_max,score`，坐标回到原始图片像素空间。原生模型类别编号在导出时处理：YOLO 的 bird 为 0，TorchVision 的 bird 为 1、背景为 0；共享 CSV 不保留类别字段，因为只有一个前景类。
- 零预测图片没有 CSV 行，因此另存完整 manifest；必须用 manifest 定义评价总体，不能只遍历“有预测”的图片。

所有 cell、局部行号与为什么这样写，请打开 [逐行 HTML](docs/notebook_walkthrough.html)。其编号按文件中的第一个 cell 从 1 开始，包含 Markdown cell，不能用执行次数 `In[n]` 替代。

## 3. 数据与预处理

下载标识是 `liugalhigh/beach-bird`，来自 [Kaggle 数据集地址](https://www.kaggle.com/datasets/liugalhigh/beach-bird)。本次浏览工具无法读取该页完整元数据，作者真名、许可和版本不能从 notebook 猜测；报告按下载标识注明来源并保留核对事项。

| 原有划分 | 图片 | 标注鸟框 | 空标签图片 | 依据 |
| --- | ---: | ---: | ---: | --- |
| Train | 1,369 | 8,663 | 154 | 实验 notebook cell 11 保存输出 |
| Validation | 291 | 1,843 | 33 | 同上，并由 manifest/evaluator 审计 |
| Test | 240 | 1,518 | 27 | 仅引用 cell 11 历史结构统计，不是测试成绩 |
| 总计 | 1,900 | 12,024 | 214 | 上表加总 |

保留数据集自带 split，没有新做 seed=42 的随机切分；42 用于训练随机状态、噪声、速度抽样和 bootstrap。已检查 train/val 都是 512×512 图片。Validation 的中位鸟数为 3，最多 100；19 张图含至少 21 只鸟，因此平均指标之外还要考察密集图。

原标签每行是 `class cx cy w h`，中心与宽高为归一化值。转换公式：

```text
x_min = (cx - w/2) * W      y_min = (cy - h/2) * H
x_max = (cx + w/2) * W      y_max = (cy + h/2) * H
```

将坐标裁剪至图像范围，再确认宽高为正。18 个验证 GT 框发生边界裁剪。空标签是有效负样本，Faster R-CNN 用形状 `(0,4)` 的 boxes 与长度为 0 的 labels 表达，而不是伪造一个背景框。

ZIP 还含标注截图等文件，解压 cell 按路径结构过滤，只取 `images/labels` 下 train/val/test 的真实 `.jpg/.txt`。结构核查不等于内容重复检查：现有记录不能证明不同 split 没有重复图片、近重复图或相关帧。

## 4. 两个模型的 method

### 4.1 YOLO26n

整体路线是图像 → backbone 特征 → neck 多尺度特征融合 → 检测头预测框与类别分数。预训练提供通用视觉特征，微调适配单一 bird 类；nano 规模用于控制成本。

实验调用 `YOLO('yolo26n.pt').train(...)`，库负责内部损失、增强和更新。该 notebook 的 `inference_settings.json` 声明使用 **one-to-many + NMS**；不应因 YOLO26 支持端到端头就把本实验写成 NMS-free 推理。当前 [官方说明](https://docs.ultralytics.com/guides/end2end-detection/)也区分了这两条输出路径。具体复现仍应固定保存日志中的版本，不应直接升级后假设行为相同。

| 配置 | 实际设置 |
| --- | --- |
| 训练尺寸 / batch | 512 / 8 |
| 轮数 | 40，日志显示实际完成 40 轮 |
| seed / deterministic | 42 / True |
| patience / AMP | 12 / True |
| optimizer | `auto`；保存日志确认实际选择 AdamW，lr=0.002，momentum=0.9 |
| 保存 | 每 5 轮周期权重，并保存 best / last |
| 主比较 | 同一 best.pt 在 640 px 推理，不是重新训练 640 模型 |

训练保存输出记录 Ultralytics 8.4.208、Python 3.13.16、torch 2.14.1+cu130、Tesla T4（约14.6 GiB显存）。`args.yaml` 保留参数，包括默认增强配置；其中列出的通用参数不一定都参与 detection 任务，不能把整个参数表逐项宣称为实际应用的增强。

cell 18 日志确认 `optimizer=auto` 忽略 `lr0=0.01`，实际使用 AdamW(lr=0.002, momentum=0.9)，权重组 weight_decay=0.0005，归一化参数和 bias 不施加该衰减。报告采用日志中的实际值。

### 4.2 Faster R-CNN ResNet50-FPN

图像 → ResNet50 提取特征 → FPN 组合不同尺度 → RPN 生成候选区域 → RoI 特征抽取 → 分类与框回归 → NMS。两阶段方法允许分别学习“在哪里可能有对象”及“候选是什么、框如何调整”。这是方法结构解释，不能直接推出它在本数据上的噪声优势来自 RPN 或 FPN。

从 TorchVision COCO 预训练模型开始，把原分类头替换成 `FastRCNNPredictor(..., num_classes=2)`：background + bird。Dataset 输出 RGB、CHW、0–1 浮点 Tensor，模型内部 transform 负责进一步归一化和尺寸处理，符合 [TorchVision 输入约定](https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.detection.fasterrcnn_resnet50_fpn.html)。

| 配置 | 实际设置 |
| --- | --- |
| 训练尺寸 | min_size=max_size=512 |
| batch / 梯度累积 | 1 / 2，通常有效 batch=2，末组可能只有1张 |
| optimizer | SGD，lr=0.0025，momentum=0.9，weight_decay=0.0005 |
| AMP / 梯度裁剪 | autocast float16 + GradScaler；max_norm=10 |
| 骨干训练 | trainable_layers=3；layer1 冻结，layer2 等后段可训练 |
| 总训练 / 选型 | 6轮；按512验证 AP 选第3轮，随后比较640推理 |
| 主模型推理 | E3 checkpoint，min_size=(640,)，max_size=640 |

训练损失为模型返回的分类、框回归及 RPN 对应项之和。`loss/window_size` 让两次反向传播相当于一组梯度平均；1369 是奇数，最后一组必须除以1，避免把最后一张图梯度错误缩小一半。更新前先 `unscale_` 再裁剪，以真实梯度范数判断。

checkpoint 不只保存权重，还包含 optimizer、AMP scaler、shuffle generator 和 torch/CUDA RNG 状态。`best_model.pt` 只保存最佳权重，`latest.pt` 保存最新完整训练状态；两者用途不同。Python/NumPy 在恢复时重新设 seed=42，而非保存恢复其任意时刻全部状态，因此不能夸大为所有环境下位级完全复现。

还有一个复现缺口：FRCNN 的新分类头在 cell 41 创建，显式 `torch.manual_seed(42)` 到 cell 42 才设置。因此仅按这两步重新运行，不能保证随机初始化的分类头也由42控制；如果后续整理为独立训练脚本，应在模型和新头创建之前设种子。本次保留原实验源码和既有结果。

历史恢复代码只加载相同 `state_dict` 并不足以保证前向等价。cell 47 明确使用 `FrozenBatchNorm2d`、`eps=0.0` 重建训练结构，之后重新导出与评价。`strict=True` 检查键和值的形状，不能检查所有非权重配置（例如 eps）。

## 5. 推理对照是怎样设计的

1. **多尺度**：固定 YOLO best.pt，分别在 384/512/640 推理，研究尺寸与成本。预测坐标始终还原到512原图，GT 分组不随推理尺寸变化。
2. **Tiling**：将512原图切成256窗口，目标 overlap=64；起点是 `[0,192,256]`，每图3×3=9块。最后两块重叠实际上为192，是补齐边界的结果，不能说所有相邻块都恰好重叠64。每块送入512输入，再加 x/y 偏移映射回原图，全图 NMS=0.50，最多300框。
3. **Selective fusion**：以整图640预测为主，仅补充原图等效尺寸<32的切块候选；候选分数分别要求≥0.50/0.70/0.85，与强整图框或已加入框重叠≥0.30则丢弃；去掉和补充框重叠≥0.50的弱整图框，按分数截到300。
4. **阈值校准**：在Validation比较FRCNN E3/E6的512预测，扫描0.10–0.85。只能解释阈值改变固定P/R/F1/MAE的效果；不能把该表的512数值和640主结果混用，也不能把最佳Validation阈值当成最终Test成绩。
5. **噪声/模糊**：固定E3和YOLO best、都在640推理；clean、Gaussian σ=10、σ=25、Gaussian blur σ=1.5。噪声在0–255像素域加入，取整、裁剪再转uint8。逐图 seed 为 `42 + int.from_bytes(SHA256(filename)[:4], 'little')`，不用Python进程随机化的 `hash()`；两模型看同一退化图。σ10与σ25共用标准正态样本，只改变强度。

## 6. 统一评价：为什么要自己导出 CSV

库内 validation 可能使用不同阈值、head、匹配和检测上限；直接比较两个库打印的 precision 不公平。统一CSV允许相同GT和指标算法独立复算，保留原图坐标，并审计每份输入的哈希。

| 概念 | 本项目的含义 |
| --- | --- |
| 导出阈值 | score≥0.001；保留低分候选用于PR排序，仍不是全部原始网络候选 |
| 固定工作点 | score≥0.25，产生TP/FP/FN、F1、计数与尺寸recall |
| 匹配IoU | ≥0.50；按预测分数从高到低，一对一匹配尚未使用且IoU最大的GT；同分保持原顺序 |
| AP50 | IoU=0.50下101个recall采样点的插值precision均值 |
| AP50:95 | IoU=0.50、0.55…0.95共10个AP的均值；单类时mAP即bird AP |
| maxDets | 每图300，区别于常见COCO默认100 |
| 计数MAE | 所有291张图上 `mean(abs(pred_count−gt_count))`，包括33张空图 |
| 尺寸recall | 按裁剪后的原图GT框 `sqrt(w*h)` 分组：Tiny<16、Small[16,32)、Larger≥32 |
| 密集图recall | 至少21个GT的图片汇总TP/GT，按对象加权 |

precision=TP/(TP+FP)，recall=TP/(TP+FN)，F1=2PR/(P+R)。AP考察分数排序和多个定位阈值，Tiny recall只看小对象在固定工作点是否找到，排名可能不同。计数MAE也不能代替定位准确率：漏一只同时误检一个可能让计数误差抵消。

`average_precision` 对precision反向累积最大值形成单调包络，再在0到1的101个recall点采样；超过可达到recall的点记0。独立 `evaluate.py` 修正了原函数依赖全局 `total_gt` 的问题，在函数中计算总GT。回归测试核对10组预测SHA和13个数值指标，检查提取代码没有改变口径。

## 7. 当前结果与选择理由

以下均是Validation，AP等比例值使用0–1，时间为同一T4公平benchmark均值。

| 配置 | AP50 | AP50:95 | P | R | F1 | Tiny R | 计数MAE | ms/图 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| YOLO512 | .8458 | .4577 | .8212 | .8123 | .8167 | .5649 | .8797 | 14.36 |
| YOLO640 | .8739 | .4693 | .8332 | .8426 | .8379 | .6818 | .8832 | 16.05 |
| FRCNN E3 640 | .8326 | .4377 | .6134 | .8703 | .7196 | .6104 | 2.7354 | 61.65 |
| FRCNN E6 640 | .8292 | .4319 | .6774 | .8535 | .7553 | .5909 | 1.9347 | 未单测 |
| Tiling256→512 | .6860 | .3234 | .5522 | .8177 | .6592 | .7403 | 3.5189 | 49.49 |
| Fusion0.50 | .8652 | .4655 | .8108 | .8486 | .8293 | .6948 | 1.0309 | 未单测 |

完整10组表见 `results/report_package/category_c_validation_results.csv`。YOLO640的AP比E3高0.0317，均值延迟约低3.84倍；E3总体recall更高，但有1011个FP，YOLO只有311。E6提高precision/F1却降低AP，说明“训练更多轮”不能用来代替选型标准。YOLO512的计数MAE略好于640，不能写640在每个指标都最佳。

Tiling的Tiny recall高于YOLO640约5.84个百分点，但FP从311升至1222，AP降至0.3234；高分融合没有改进整体AP。Fusion0.85导出行数与整图640相同，现有结果与基线一致，不能说它带来了新收益。现阶段选择YOLO640为主方案，FRCNN E3为有效对照，保留Tiny噪声表现这个不同维度。

### 7.1 强噪声揭示了什么

| 条件 | YOLO AP | FRCNN AP | YOLO Tiny R | FRCNN Tiny R |
| --- | ---: | ---: | ---: | ---: |
| Clean | .4693 | .4377 | 68.18% | 61.04% |
| Noise σ10 | .4561 | .4235 | 57.79% | 55.84% |
| Noise σ25 | .3787 | .3757 | 26.62% | 50.65% |
| Blur σ1.5 | .4189 | .3890 | 42.21% | 39.61% |

强噪声下整体AP几乎接近，但FRCNN找到更多Tiny GT。YOLO下降41.56个百分点，FRCNN下降10.39个百分点；不是“下降41.56%”这种相对百分比。该优势不是所有退化条件都成立，例如blur下仍是YOLO的Tiny recall略高。

### 7.2 如何证明是在比较同一只鸟

分析表给每个GT分配 `image_id::gt_idx`，在8个配置中记录是否匹配、分数和IoU，并逐配置核对TP总数和尺寸recall。

- Clean→Noise25的Tiny转移：YOLO stable=40、lost=65、recovered=1、missed_both=48；FRCNN stable=71、lost=23、recovered=7、missed_both=53。Lost减Recovered才是净损失，不能直接把Lost当净下降。
- 在同154个Noise25 Tiny GT上：两者都找到38、仅YOLO找到3、仅FRCNN找到40、都没找到73。不是两组不相关的小鸟平均值。
- 5000次按完整图片有放回抽样，并在同一组抽样索引上比较两模型：Noise25的FRCNN−YOLO Tiny recall差为+24.03pp，95%百分位区间[6.09,41.10]pp；两者退化变化差+31.17pp，区间[12.33,44.90]pp。

对象共享一张图的背景、光照与密度，不能把1843只鸟当成独立样本抽样。代码以291张图为cluster，分子TP求和/分母GT求和，计算的是对象加权recall；没有Tiny的图仍参与抽样，只对该统计量贡献0。当前5000次抽样分母都>0，代码通过assert核对；换数据若出现零分母需要显式处理，不能说实现自动处理了一切情况。

### 7.3 错误诊断与负图

对clean找到、noise下丢失的对象，检查**导出后**候选：

1. 有score≥0.25且IoU≥0.50的候选：assignment conflict，可能被一对一匹配分配到其他GT。
2. 只有低分但足够重叠框：below confidence threshold。
3. 有高分且IoU在[0.10,0.50)的近邻：sub-threshold localization。
4. 只有低分近邻：weak nearby candidate。
5. 没有IoU≥0.10的导出框：no nearby exported candidate。

这是有优先级的输出分类，并非内部网络故障定位。NMS或score<0.001可能已经截掉候选，不能把“没导出”写成“RPN没有生成”。`score_at_best_iou` 是IoU最高候选的分数，不一定是触发分类分支的候选分数，也不是所有候选中的最高分。

Noise25 Tiny lost中，YOLO四个非零类别为低分27、定位15、弱近邻9、无近邻14（合65）；FRCNN为10/5/4/4（合23）。低分类占各自Lost的约41.5%和43.5%，比例接近；主要差异是丢失的绝对数量，不能说YOLO只因置信度问题而FRCNN没有这个问题。

33张空图在clean下FP总数为YOLO28/FRCNN67，Noise25为14/45。FP减少同时伴随Tiny召回下降，不能仅凭空图FP变少宣称鲁棒性提高。案例图按GT配对分歧排序选出1455/1486/1604等图，是系统选例，仍不是随机总体样本。

## 8. 已发现的问题与当前处理

| 问题 | 当前处理 / 文档应怎样说 |
| --- | --- |
| 历史 `gt` 字典被可视化循环中的局部同名变量覆盖 | cell70重建GT；独立evaluator显式接收GT，减少全局依赖 |
| FRCNN恢复结构配置不等价 | 保留原始结果；以后用FrozenBatchNorm2d、eps=0.0的修正版 |
| COCO maxDets300摘要AP显示-1 | 不是负准确率；默认summarize的AP读取依赖100上限，改从precision张量明确选择MaxDet维度，见cell71/72及corrected JSON；[官方源码](https://github.com/cocodataset/cocoapi/blob/master/PythonAPI/pycocotools/cocoeval.py)可核对 |
| 两个同名“size统计”不同 | cell14在640缩放后仅作探索，正式分组用原图，Tiny154/Small497/Larger1192 |
| `latest.pt`已是E6，cell53仍断言epoch==3 | 这是E3阶段状态检查，今天重跑会失败；保留源代码并在HTML标注，不能盲跑全部cell |
| 默认路径只适合Colab | 分析支持BIRDSCOPE_ROOT；训练还含硬编码/content及Drive，独立训练推理入口未完成 |
| 安装用 `pip -U` | 历史操作未固定版本；复现应从训练日志恢复环境，不能将打包CPU版本当训练版本 |
| 旧README称权重与数据仍只在Drive、模块未验证 | 本地实际已有ZIP、权重和独立evaluator回归证据；原README保留，根README明确当前状态 |
| Test表述易过度 | 没有最终测试评估；实验cell9/11曾提取并检查Test结构/标签，不能宣称“从未访问过Test” |

## 9. 运行方式与结果可信度边界

**只读学习**：先README，再本文，再HTML；不会自动执行任何训练。HTML内嵌全部source行，可复制单个cell；有搜索、按cell/行定位和每个cell重跑提醒。

**复算Validation**：用带numpy的Python运行现有回归脚本。它读取ZIP的val标签及固定CSV，不加载模型，不访问Test标签。分析Notebook还需pandas/matplotlib/OpenCV/IPython，设`BIRDSCOPE_ROOT`为本地根路径后从上到下运行；会重写`results/analysis/`中的分析输出，先保留已有证据再重跑。

**训练复现**：用Colab GPU路径运行相应训练段，保留原始split和配置；不能把本目录视为已经验证的本地一键训练工程。当前整理不新增无关实验，不自动在Test上选阈值或选模型。

结论只覆盖当前验证集、一个训练seed、两个具体checkpoint及每张图一次合成噪声实现。bootstrap反映该样本上的图片抽样不确定性，不涵盖重训练seed、自然噪声、领域迁移或新海滩环境。两个模型训练预算不同，不能把差异全部归为架构。原有数据split也未完成内容去重与相关帧泄漏审计。

## 10. 最后已经有什么，还缺什么

已经有：两个模型的训练证据、10配置统一验证总表、8配置鲁棒性分析、配对Tiny结果、5000次cluster bootstrap、7张分析图和案例图、14预测CSV冻结审计、三个代表配置的corrected COCO核验，以及独立evaluator和回归测试。

本次补充：项目导航、本文、两份notebook全部source行的HTML讲解，以及按全组跨方法比较规划的英文IEEE框架。只有已有DL部分有正文和数字，其余留空；详细 `category_c.tex` 参考材料不再引入主文，原先DL主导的5页稿已完整归档。

仍缺：两种传统CV与VLM的实际方法和结果、跨方法统一协议和最终讨论、真实完整作者信息、数据集许可归属核实、冻结协议后的最终Test、依赖锁定及完整独立训练/推理工程。这些会明确保留为交付缺口，而不是填成猜测的最终成绩。
