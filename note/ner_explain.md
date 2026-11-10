# BiomedicalNER explain：架构、方法、问题与当前结果

本说明依据当前目录的 notebook 源代码、冻结协议、原始预测 ZIP 与 CSV 编写，整理于 2026-11-09 开始，最终文档核验于 2026-11-10 完成（Australia/Sydney）。本次执行的是 CPU 数据分析、保存预测的重评分和文档验证，没有重新训练或调用 GPU 生成。证据见 [核验说明](verification.md) 与 [机器审计](generated/evidence_audit.json)。

## 1. 项目在解决什么问题

输入一篇医学文献的标题和摘要，输出每个疾病 mention 在原文中的精确位置。每篇的全文固定为 title + 一个空格 + abstract。评价的是疾病 mention 的字符跨度，不评价 MeSH/OMIM 概念归一化，也不把 token accuracy 当成 NER 的最终指标。

同一个疾病名称在文中出现多次，是多个位置不同的 mention；名称种类数量、mention 数量和概念数量不能互换。

项目设计比较三种 encoder（General BERT、BioBERT、PubMedBERT）与生成式 Qwen。当前真实可复核结果覆盖 Qwen；encoder 部分只有接入/评分逻辑，没有足够数据得出排名。

## 2. 统一的架构是什么

这是共享实验协议的数据与文件流水线，而不是一个部署中的单体软件。不同 notebook 有分离的职责，但历史 scorer、加载和工具函数存在复制，并未统一抽成一个运行包。本次先统一解释与证据入口，保留历史执行逻辑。

~~~mermaid
flowchart TD
    A[冻结 Train / Dev / Prompt] --> B[去重、校验与 seed42 嵌套子集]
    B --> C[每规模独立 QLoRA · 五轮]
    C --> D[每轮完整 Dev · 历史 exact-name-v2 选 epoch]
    D --> E[固定 adapter · 统一 FP16 Dev 复评]
    E --> F[冻结六模型配置 · 先生成全部 Test raw]
    F --> G[历史 exact-name-v2 Test 报告]
    F --> H[原始输出重新定位 spans]
    E --> H
    I[Encoder trials · 等待真实数据] --> J[Dev strict-span 选 trial]
    J --> K[只评获选 trial 的 Test]
    H --> L[共享严格跨度评分与比较]
    K --> L
    A --> M[EDA · 描述性分析]
~~~

| 层 | 文件/产物 | 职责 |
|---|---|---|
| 数据与冻结协议 | 根目录 Train/Test、输入 KIT ZIP、protocol_lock.json | 相同文本、PMID、Prompt、模型 revision 与数据哈希 |
| Qwen 训练 | 根目录 75_100_Run notebook | 新建各 scale adapter，续训完整 checkpoint，逐 epoch Dev 评估 |
| Dev 分析 | Analysis_FP16 notebook / analysis_fp16_v1 | 不训练；统一推理精度，保留原始输出和历史结果 |
| 最终 Test | Final Evaluation notebook / final_test_fp16_v1 | 先完成六组 raw 输出，再统一历史评分，冻结选择 |
| EDA | Cross-section/EDA | 文档/实体分布、重复与 split 完整性、嵌套名称覆盖 |
| 统一比较 | Comparative_Analysis notebook | 重建 strict spans；encoder BIO/span 适配、trial 选择与配对分析 |
| 报告与教学 | report、docs | 引用已核实证据，说明 method、局限和待补部分 |

**归档是关键输入。** analysis/test 两个目录中散落副本不完整；本次发现所需的 36 项基础文件中有 19 项散落副本缺失，但都能在两个完整 ZIP 中取得。清单见 [missing_loose_artifacts.csv](generated/missing_loose_artifacts.csv)。这不是预测丢失，也没有为“补齐”而编造或重跑预测。

## 3. 数据和 EDA

从冻结 Train 的 593 条记录中，PMID 8528200 有一条完全相同重复；先确认记录一致再按 PMID 合并，得到 592 篇。原文件保留 593 条，不直接改写。所有 spans 都采用 Python Unicode 字符下标的半开区间 [start, end)，不是 UTF-8 字节，也不是 tokenizer token 下标。

| Split | 文档 | Gold mentions | 大小写敏感 unique names | 每篇平均空白词数 | 每篇平均 mentions |
|---|---:|---:|---:|---:|---:|
| Train | 592 | 5,134 | 1,691 | 190.68 | 8.67 |
| Dev | 100 | 787 | 363 | 201.09 | 7.87 |
| Test | 100 | 960 | 424 | 204.02 | 9.60 |

本次新增 [EDA notebook](../Cross-section/EDA/NCBI_Disease_EDA.ipynb) 的 7 个代码 cell 已实际顺序执行，逐字段复核两份历史汇总 CSV。新增输出位于 reproduced_outputs，原 eda_outputs 不变。它检查：

- 三个 split 的冻结字节 SHA256、title/abstract 拼接、每个实体文本切片。
- 重复 PMID 的内容一致性，gold span 的范围、唯一与不重叠。
- 跨 split PMID 和完全相同全文交集均为空。

这些检查不排除近似重复、语义相似文献或基座预训练污染。不能把“无精确交集”写成“完全没有任何数据泄漏”。

先按字符串 PMID 排序，再用独立 random.Random(42) 打乱，取共同前缀形成训练集。因此小规模确为大规模子集，不是五次独立随机抽样。

| Scale | 文档 | Mentions | Unique names | Dev mention 名称覆盖 | Test mention 名称覆盖 |
|---|---:|---:|---:|---:|---:|
| 10% | 59 | 562 | 266 | 38.25% | 33.75% |
| 25% | 148 | 1,449 | 620 | 50.70% | 47.50% |
| 50% | 296 | 2,723 | 1,042 | 55.91% | 54.90% |
| 75% | 444 | 3,928 | 1,389 | 59.59% | 58.44% |
| 100% | 592 | 5,134 | 1,691 | 63.53% | 61.56% |

覆盖率 = 名称在该训练子集的 gold 名称集合中出现的 held-out gold mention 次数 / 全部 held-out gold mention 次数；区分大小写。相同名称重复出现会按 mention 分别计数。这不是 unique-name coverage，更不是模型 recall。

全量训练仍有 38.44% Test mentions 的名称未在训练标注中出现，说明纯精确名称查表不足以覆盖全部 gold。模型能否泛化到未见名称，还需独立 seen/unseen 分层；覆盖和 F1 同增不能证明因果。Test EDA 是历史冻结完成后的描述，不能据此调整当前测试方案。

## 4. Qwen 的训练 method

### 4.1 输入、目标和 loss

模型为 Qwen/Qwen3-4B-Instruct-2507，revision 固定 cdbee75f17c01a7cc42f958dc650907174af0554。system Prompt 从冻结 KIT 读取，不重新编写。user 是完整 title + 空格 + abstract；assistant 目标类似 {"entities":["disease name", "..."]}，按 gold 的原文顺序去重。

训练优化自回归 token 交叉熵：给定 Prompt 与已生成的答案前缀，预测答案下一个 token。labels 在 Prompt 和 padding 位置设为 -100，因此只对 assistant JSON 的有效位置计算 loss。并非让模型学习复述整篇摘要，也不是直接监督每个字符的 BIO 标签。

chat template 的完整训练对话必须以生成 Prompt 为前缀，代码用 assert 验证；否则按长度设置 loss mask 会错位。完整序列超过 1536 tokens 直接报错，避免静默截掉长摘要中的实体。

### 4.2 为什么用 QLoRA

量化基座冻结，训练低秩 LoRA 分支。可将线性层理解为 W0 + (alpha/r)BA，其中 W0 不更新，低秩 A/B 才接受梯度。4-bit NF4 降低基座存储成本；double quantization 进一步压缩量化常数。量化存储与计算 dtype 是两个不同概念。

| 参数 | 75/100% notebook 的实际设置 |
|---|---|
| 种子 / 总轮次 | 42 / 5 |
| LoRA | r=16，alpha=32，dropout=0.05，all-linear，bias=none |
| 基座训练存储 / 计算 | NF4 4-bit + double quantization / FP16 on T4 |
| 优化器 / 学习率 | adamw_torch / 1e-4 |
| micro batch / 累积 | 1 / 8，单GPU名义有效 batch=8 |
| scheduler / warm-up | linear / 0.05 |
| 内存策略 | gradient checkpointing，训练 use_cache=False |
| Dev/Test 推理 | 完整 FP16 非量化基座 + 选中 adapter；SDPA，greedy，512新tokens |

QLoRA 原论文也讨论 paged optimizers，但本项目明确使用 adamw_torch，不能把论文所有机制都写成本实验实现。原理依据见 [QLoRA 原论文](https://arxiv.org/abs/2305.14314)。

10/25/50% 的训练记录来自历史队友归档，原训练为 BF16；75/100% 为 T4 FP16。本次未补造早期训练 notebook，也不声称所有组在相同设备上重新训练。

### 4.3 规模独立、epoch 连续

75%与100%各自从同一冻结基座新建 adapter，不是先训练75%再加数据续训到100%。同一 scale 的 epoch 则连续恢复：

1. 先做8篇、一次 optimizer step 的 smoke test，验证前向/反向与有限 loss。
2. Trainer 的总训练计划始终是5 epochs。
3. on_save 在目标 epoch checkpoint 写完后停止本次调用。
4. 下一轮恢复完整 optimizer、scheduler、RNG、trainer state 和 adapter，使五轮学习率计划连续。
5. 每个 epoch 用完整100篇 Dev生成并评价，保留全部候选。

只复制 adapter 不等价于完整训练恢复；partial metrics 不等价于全 Dev 完成。当前缺失输入不能通过删 checkpoint、删 lock 或降低 assert 来“修复”。

### 4.4 真实选型历史

历史 Qwen 按 exact-name-v2 的完整 Dev F1 最大值选 epoch，同分取最早，五轮齐备才 selection_complete。五档最终是4/5/5/4/5。统一 FP16 分析与新 strict scorer 都沿用这些 adapter，**没有按新 strict scorer 对25个epoch重新选模**。

因此报告必须说明选型口径与最终排名口径的不同。五轮是一个配置下的五个 checkpoint，不是五次不同超参数配置。队友 encoder 调参次数可以不同，但必须披露搜索预算；不能默认所有模型搜索成本相等。

## 5. 从名称到跨度：为什么有两套分数

Qwen 生成名称而不是位置，按固定后处理转 spans：

1. 解析 JSON，允许移除完整的 JSON 代码围栏；要求对象有 entities 列表。
2. 对非空字符串去重，按大小写敏感的字面原文搜索。
3. 相邻字母数字检查防止 DM 命中 DMPK 之类词内部。
4. 一个名字匹配全文所有出现位置；候选重叠时先取长 span，再保留非重叠集合。

这层映射可能把同一字符串所有出现都判成疾病，也可能因大小写、表述改写或边界不符漏掉实体。它是生成式系统的一部分，不能与直接 BIO 定位完全等同。没有用模糊匹配替模型“修正”名称。

| 规则 | 历史 exact-name-v2 | 跨模型 strict-span |
|---|---|---|
| TP | 精确跨度交集 | 同左 |
| FP | 实际多报spans + 无效项惩罚 | 仅实际多报spans |
| 坏 JSON/schema | 空预测 + 1个合成FP | 空预测，格式问题另记 |
| FN | gold中未命中跨度 | 同左 |
| 用途 | 保留历史选epoch/报告 | 统一与encoder比较 |

每篇必须先按PMID对齐。TP/FP/FN再累加整个split，P=TP/(TP+FP)，R=TP/(TP+FN)，F1=2TP/(2TP+FP+FN)。分母为0时按代码返回0。边界差一个字符也不是TP；不平均每篇F1。

本次从完整归档原始output重建 spans，而非仅相信保存的predicted_spans。两套重算分别与原metrics及现有strict CSV一致。没有改旧metrics，也没有把重新评分称作重新训练。

## 6. 当前结果与能支持的结论

| 训练规模 | 选中epoch | Dev strict F1 | Test P | Test R | Test strict F1 | Test旧F1 |
|---|---:|---:|---:|---:|---:|---:|
| Zero-shot | — | 41.37% | 52.72% | 32.29% | 40.05% | 38.94% |
| 10% | 4 | 66.27% | 71.98% | 60.73% | 65.88% | 65.36% |
| 25% | 5 | 73.31% | 79.37% | 73.75% | 76.46% | 76.25% |
| 50% | 5 | 81.50% | 80.25% | 81.25% | 80.75% | 80.66% |
| 75% | 4 | 84.71% | 84.27% | 81.46% | 82.84% | 82.75% |
| 100% | 5 | 85.02% | 85.36% | 86.88% | 86.11% | 85.98% |

Qwen全量严格跨度Test TP/FP/FN=834/143/126；相对zero-shot提高46.06个百分点。旧full-data分数85.98%多算3个合成FP；zero-shot多44 FP而得到38.94%。取消惩罚改变的是评分定义，不是模型质量。

75%→100%的Test TP从782增至834，FP从146降至143，FN从178降至126，F1 +3.27个百分点；Dev只+0.31个百分点且FP114→134，体现precision/recall取舍。不能写“每项指标都稳定提升”。

配对文档bootstrap用相同PMID有放回采样，每次重新累计计数算micro F1。strict scorer、3000次、seed2026下，75→100% Test差的95%区间[0.84,5.73]个百分点，Dev为[-2.66,2.93]。Test 50→75%为[-0.21,4.26]，包含0；不能把每个相邻规模提升都称显著。区间描述固定模型下文档抽样，没有多seed训练方差，也未做多重比较修正。历史Test notebook用旧scorer且5000次，不能混用其区间。

全量模型Test recall按空白词长：1词433/472=91.74%，2词264/305=86.56%，3词以上137/183=74.86%。长组仍漏46个mention，占全部126 FN的36.51%。长度与低频/疾病类别可能混杂，不能称为纯长度因果。

输出可靠性：Test zero-shot有28篇无效输出诊断，全量2篇；10%有3篇JSON失败且3篇生成达到上限。本次计数未据此单独证明截断导致JSON失败。诊断数和synthetic_fp_penalty也不同：一篇可有多个无效名称。

历史Test生成合计zero-shot251.65秒、全量503.19秒（各100篇）；这是保存记录中的生成范围，不含下载、模型加载、训练全成本，也不是跨模型同步硬件benchmark。

## 7. 已发现的问题与处理状态

| 问题 | 影响 | 本次处理 |
|---|---|---|
| 标题Seed=4、LR=1e-，实际42/1e-4 | 读者抄错方法 | explain/HTML/报告按代码纠正；原notebook完整保留 |
| 旧scorer与strict分数混用 | 跨模型排名不公平 | 双口径对照，报告主结果用strict，选型历史单独披露 |
| 散落目录19项基础文件缺失，ZIP完整 | choose_source会选不完整目录而失败 | CPU审计直接读ZIP；列缺件，不覆盖或搬移旧实验 |
| 根目录无dev.jsonl，比较notebook却要BASE/dev.jsonl | 原比较notebook全新本地执行失败 | EDA/审计直接读KIT中的Dev；未偷偷改原notebook或补造源文件 |
| 缺qwen_75_100_colab_bundle.zip、50% adapter ZIP | 无法直接重训/完整重新推理 | 明确限制；当前CPU重评不依赖权重 |
| best_adapter_75_epoch_4缺adapter_config.json | 75%直接PEFT加载不完整 | 记录问题，需从匹配原checkpoint/原归档核验后补齐，未凭空生成 |
| cell30先检查75%导出，cell37才真正导出 | 全新线性执行可能失败 | HTML明确执行依赖；未重排历史cells |
| 原比较BASE回退/mount描述有差异 | Mac不是/content或/mnt/data | 文档说明；新增CPU脚本支持当前项目 |
| 训练LOCK存在时不全面比对，smoke通过标记会复用 | 旧环境标记可能过期 | 指出保护范围，未声称这些检查足够 |
| 多处复制scorer/加载代码 | 未来改动易出现口径漂移 | 保留历史快照；新增CPU审计直接提取核查过的notebook定义，不另猜一套scorer |
| 单seed、不同训练精度与GPU | 数据效率与架构结论有混杂 | 在报告局限中披露；没有补造多seed结果 |

原checkpoints中还有不完整散落文件，不能仅凭目录名认定可恢复训练。当前100% best adapter目录有配置与权重，75%有权重但缺配置；10/25% ZIP存在。项目状态表不能替代当前实际文件核查。

## 8. Encoder接入与跨模型比较后续

每个model×scale×trial至少提供实际checkpoint/参数/seed、Dev全部100篇原始预测、文本或text_sha256、同文字符坐标、trial预算与资源日志。预测二选一：predicted_spans；或tags + offset_mapping。BIO可用B/I/O或B-Disease/I-Disease，特殊token为(0,0)并用O/-100；不同原文、重复PMID、错位offset或同时提供两种格式会被拒绝。孤立I被转换器视作新实体并记录诊断，这一政策也须披露。

在Comparative_Analysis的ENCODER_RUNS登记每次真实trial。确认某模型×规模的全部Dev trials收齐后，才加入TRIAL_GROUPS_FINALIZED，由Dev strict F1选最优；同分按trial_id。随后只读取获选trial的Test，不能用Test替换模型。本文不提供占位trial假分数。

收到真实数据后才能补齐：四模型同规模主表、不同搜索预算敏感性、paired CI、实体错误互补、同硬件或明确限制的效率比较。BioBERT/PubMedBERT论文成绩是文献背景，不是本项目实测。

## 9. 文件保全、复现和参考

原始report/main.tex、references.bib备份在[archive/report_before_2026-11-09](archive/report_before_2026-11-09/)，修改前全部文件SHA256清单在[original_files_sha256.json](archive/original_files_sha256.json)。本次原有4个notebook、数据和实验文件保留；报告正文改写并有完整旧版可查。当前目录不是Git checkout，本次未初始化Git、未提交或推送。

新增工具与使用顺序见[README](../README.md)。HTML由当前notebook源生成，有每cell源码哈希与覆盖清单，修改notebook后要重新生成。CPU核查通过不意味着Colab CUDA训练已复跑；report仍是等待encoder数据的草稿。

方法背景来源：[BioBERT](https://arxiv.org/abs/1901.08746)、[PubMedBERT](https://arxiv.org/abs/2007.15779)、[QLoRA](https://arxiv.org/abs/2305.14314)。具体项目参数与数字以本地冻结协议和本次审计为准，不能把论文配置直接套进本项目。
