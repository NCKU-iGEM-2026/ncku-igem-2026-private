(function () {
  'use strict';
  var root = document.getElementById('engineering');
  if (!root) return;
  var stages = ['design', 'build', 'test', 'learn'];
  // The records. Each iteration carries the four DBTL stages, each with a
  // subtitle, body, details and conclusion, plus its sources and attachments.
  // In the text, *word* is set in italics and [S1]/[F1] become citation marks
  // pointing at the lists at the foot of the page.
  //
  // Nothing here may be written without a source. Where the records do not yet
  // say, the text says so plainly rather than filling the gap.
  var modules = [
    {
      name: 'Module 1',
      title: 'Retron aptamer production',
      question: 'Can the Ec67 retron construct be assembled and verified before testing aptamer production and function?',
      iterations: [
        {
          name: 'Construct assembly and initial screening',
          note: 'Colony screening',
          status: '',
          design: {
            subtitle: 'Establish a retron-based aptamer source',
            body: 'The team proposed using an Ec67 retron in *E. coli* to generate aptamer-containing single-stranded DNA. The initial objective named ALS5-1; the master design later identifies Cb-2 as the aptamer in its component list. The recorded circuit is T7–msr–msd/Cb-2–RT, with a T7 promoter, a 5′ UTR/RBS, Ec67 reverse transcriptase, the Cb-2 region, and a 3′ region. The rationale is to build and check the retron construct before attributing any fluorescence change to aptamer activity. [S1]',
            details: 'The master design lists TOP10 and BL21(DE3) as hosts and pTwist as backbone, while its protocol pages describe pET28a-Ec67 and BL21(AI). The identity and roles of the final constructs and strains require reconciliation. A construction-level success criterion is a colony-PCR product at the annotated target size of 3,123 bp; sequence-level confirmation and a functional success threshold are not yet recorded. [S1]',
            conclusion: 'This iteration first asks whether candidate retron-containing colonies can be obtained and screened. The change from ALS5-1 to Cb-2 is documented, but its date and rationale are not yet recorded. [S1]'
          },
          build: {
            subtitle: 'Assemble and introduce the candidate construct',
            body: 'The master design marks commercial synthesis of a codon-optimized sequence, conventional restriction cloning, electroporation, antibiotic selection, and colony PCR as used. Its protocols describe restriction digestion and ligation, transformation of a pET28a-Ec67 plasmid into TOP10 and BL21(AI), and preparation of a TOP10 master plate for colony screening. [S1]',
            details: 'The master-design checkbox specifies EcoRI/PstI, whereas the detailed digestion protocol specifies EcoRI/SacI. The backbone also differs between the overview and protocol. Because an assembly log and final plasmid map are absent, the exact enzyme pair, final insert, construct identity, and number of screened colonies are not yet recorded. [S1]',
            conclusion: 'The recorded workflow reached the candidate-colony screening stage; the supplied material does not establish a sequence-verified final construct. [S1]'
          },
          test: {
            subtitle: 'Screen colonies by PCR and gel electrophoresis',
            body: 'The gel image dated 2026-07-16 shows approximately five distinct adjacent sample bands at similar positions, plus a faint band farther right; other right-side sample lanes have no clear band. The image labels a 3,123-bp target and a 3,000/4,000-bp ladder interval. This qualitative screen does not establish the exact product size, correct sequence, or aptamer function. [F1][S1]',
            details: 'The image filename calls the left five lanes TOP10-pLasRV, while the master-design caption calls them TOP10-Ec67; both refer to Ec67-BL21 on the right. The 3,123-bp label is placed above a sample well rather than directly beside a band. A verified lane map, exact positive counts, a confirmed negative control, band quantification, and independent replicate count are not yet recorded. [F1][S1]',
            conclusion: 'Several screened samples have a visible PCR product at a similar migration position. Conflicting lane labels and absent sequence validation prevent a definitive construct-identity claim. [F1][S1]',
            // Uploaded through the iGEM uploads tool, as every image must be.
            figure: {
              src: 'https://static.igem.wiki/teams/6379/wiki/engineering/retron-ec67-aptamer-master-design-2026-05-17-etr-lutyecn4jz-20260716-pcr-top10-plasrv-and-ec67-bl21.avif',
              alt: 'Colony-PCR gel dated 2026-07-16, with about five distinct adjacent bands at similar positions and faint or blank lanes to the right.',
              label: 'F1',
              caption: 'Colony-PCR gel dated 2026-07-16: about five distinct adjacent bands at similar positions; other right-side sample lanes are faint or blank. The image marks a 3,123-bp target, but its left-lane identity conflicts with the master-design caption.'
            }
          },
          learn: {
            subtitle: 'Resolve construct identity before functional claims',
            body: 'The screening record supports selecting candidate colonies for further verification, but it does not show that Ec67 produced the intended ssDNA or that Cb-2 reduced reporter fluorescence. The master design states that lower fluorescence with the retron plasmid is an expected outcome, not an observed result. Its proposed troubleshooting is to check aptamer production, reconsider ALS5-1, or redesign the plasmid if the system fails. [S1]',
            details: 'Before a functional iteration, reconcile the gel lane map, backbone, host, restriction enzymes, and aptamer identity; add sequence verification and direct evidence for aptamer production and reporter response. The source also lists RT-qPCR, TRIzol, an in vitro inhibition study, and origin replacement, but their design sheets contain no usable result tables; these are not outcomes of E1-I1. [S1]',
            conclusion: 'Candidate PCR bands justify further validation, not a claim of retron-derived aptamer activity. The next iteration should connect a verified construct to a specific aptamer-production and functional readout. [S1]'
          },
          attachments: [
            { id: 'F1', where: 'E1-I1 · Test', file: '[Retron-Ec67-Aptamer]master design 2026-05-17 (etr_lUTYecn4Jz) 20260716 PCR Top10-pLasRV(左五） and Ec67-BL21(右四）.png', note: 'Colony-PCR gel dated 2026-07-16: about five distinct adjacent bands at similar positions; other right-side sample lanes are faint or blank. The image marks a 3,123-bp target, but its left-lane identity conflicts with the master-design caption.' }
          ],
          sources: [
            { id: 'S1', note: '*Retron-Ec67-Aptamer_實驗記錄彙整*, exported 2026-09-28; master design created 2026-05-17, last modified 2026-09-11; sections 1, 2.3–2.5, 2.8–2.9, 3, 4.2, 5', file: 'Retron-Ec67-Aptamer_實驗記錄彙整.md' }
          ]
        }
      ]
    },
    {
      name: 'Module 2',
      title: 'Detecting 3-oxo-C12-HSL',
      question: 'We aim to turn recognition of the *Pseudomonas aeruginosa* quorum-sensing signal 3-oxo-C12-HSL into a measurable fluorescence change.',
      iterations: [
        {
          name: 'Aptamer Design',
          note: 'Aptamer Design',
          heading: 'Selecting a signal-switching aptamer design',
          status: '',
          approach: 'Structure-Switching Fluorescent Aptasensor for 3-oxo-C12-HSL',
          aim: '',
          design: {
            subtitle: 'Converting target binding into a readout',
            body: 'We considered a structure-switching design in which a fluorescent aptamer is paired with a quencher-bearing complementary strand. Our working hypothesis is that target binding could favor a different DNA configuration, separate the fluorophore from the quencher, and increase fluorescence. We considered ALS-5 because the supplied research notes identify it as a 3-oxo-C12-HSL-binding aptamer; its reported quorum-sensing effects are context for selecting a candidate, not evidence that our sensor works.',
            details: 'The comparison needed to judge this design is fluorescence with and without 3-oxo-C12-HSL under matched conditions. The notes mention both ALS-5 and ALS-5-1 without identifying the version selected for a sensing construct.',
            conclusion: 'We selected target-dependent strand displacement as a candidate transduction mechanism. Its compatibility with the chosen 3-oxo-C12-HSL aptamer still needs to be established.'
          },
          build: {
            subtitle: 'Defining a testable fluorescence pair',
            body: 'We would pair a labeled aptamer with a quencher-labeled complementary strand, then compare the assembled sensor before and after adding target. The supplied records describe this design principle and oligonucleotide-labeling options, but do not document a synthesized or assembled team construct.',
            details: 'Shortening the complement, adding mismatches, or changing its GC content are proposed ways to weaken excessive duplex stability; the records do not show that we implemented or compared them.',
            conclusion: 'Our next build decision depends on a confirmed sequence and labeling scheme. We cannot yet identify a constructed sensor version from these records.'
          },
          test: {
            subtitle: 'Separating literature precedent from our measurement',
            body: 'We have not yet documented a fluorescence trace, target titration, or specificity comparison for our proposed 3-oxo-C12-HSL sensor. A structure-switching response reported for a different target cannot serve as our result.',
            details: 'Any reported swarming or biofilm effects in the source notes are results from other studies and cannot substitute for sensor validation.',
            conclusion: 'The proposed optical mechanism remains unverified in our system. We need measurements with our own aptamer and target before reporting performance metrics.'
          },
          learn: {
            subtitle: 'Balancing quenching against target binding',
            body: 'We identified a central design risk: a complementary strand stable enough to suppress background might also impede aptamer binding or slow signal recovery. We will first establish whether the selected aptamer and fluorescence pair produce a target-dependent response, then adjust complement stability only if the data reveal excessive background or weak switching.',
            details: 'The source notes also mention selecting aptamers for switching during in vitro selection, but do not document that our team performed such a selection.',
            conclusion: 'The next iteration can be defined once a measured response identifies the limiting step. We should not claim sensitivity, specificity, or reusable sensing before those tests.'
          },
          requests: [
            'Attachment slot — sensor schematic: Add the team-approved ALS-5/ALS-5-1 fluorophore–quencher diagram and the original fluorescence plots when supplied; no matching team image file is named in the current notes.',
            'Design — selected candidate and sensor drawing: Confirm ALS-5 or ALS-5-1; provide the complete aptamer and complementary-strand sequences, labeling positions, and a diagram of the proposed fluorophore–quencher arrangement. This fills the exact sensor identity in Design and Build.',
            'Build — preparation evidence: Provide oligonucleotide order sheets or synthesis specifications, hybridization procedure, buffer, concentrations, temperature, and any quality-control evidence. If nothing was assembled, confirm that this page should remain a design-only account.',
            'Test — primary fluorescence files: Provide raw target/no-target readings, target concentrations, time points, non-target AHL controls, replicate definitions, and any sputum-like matrix results, plus analysis plots. These populate Test without borrowing performance values from the literature.',
            'Learn — decision record: State what the team concluded from its own measurements and whether it changed the complement length, mismatch pattern, GC content, or aptamer variant. Supply dates or version labels so a later Iteration can be added only when supported.'
          ]
        },
        {
          name: 'LasR Circuit Design',
          note: 'LasR Circuit Design',
          heading: 'Designing the initial receptor–reporter circuit',
          status: '',
          approach: 'LasR–pLasRV–sfGFP Reporter Construction in *E. coli*',
          aim: 'We designed a two-module reporter intended to translate 3-oxo-C12-HSL recognition into GFP fluorescence in an *E. coli* host.',
          design: {
            subtitle: 'Connecting an AHL-responsive receptor to a visible output',
            body: 'We chose a two-module logic: ProD drives LasR, while the LasR-responsive pLasRV promoter drives sfGFP. We expected reporter fluorescence to increase with 3-oxo-C12-HSL concentration, giving us a way to distinguish an AHL response from basal expression.',
            details: 'The master design lists ProD (BBa_K2759001, 144 bp), BBa_B0034 RBS (12 bp), an *E. coli*-optimized LasR CDS (756 bp), a terminator, pLasRV (120 bp), a second BBa_B0034 RBS, and sfGFP (714 bp). It names *E. coli* TOP10 and a chloramphenicol-selected backbone. The optimization note records use of an *E. coli* setting in the Twist tool; it does not establish that the final plasmid was sequence-verified.',
            conclusion: 'We defined a receptor and reporter architecture with a testable fluorescence output. The parts list alone does not establish the exact sequence of the tested plasmid.'
          },
          build: {
            subtitle: 'Moving from a parts list to a reporter strain',
            body: 'Later assay records name TOP10 carrying a pTwist/pLasRV reporter, so a reporter-bearing strain was used in testing. The supplied master design lists alternative assembly methods rather than a definitive assembly record, and we cannot establish the precise construct from the changing plasmid names alone.',
            details: 'The documents alternately use pTwist, pSB1C3, pLasRV, pLas, and pluxR; the v1 co-culture record identifies TOP10/pTwist-pLasRV or TOP10/pLasRV-sfGFP.',
            conclusion: 'We can describe the intended circuit and the strain labels used in assays. We cannot yet claim that every listed part was verified in the tested strain.'
          },
          test: {
            subtitle: 'Establishing the signal-response baseline',
            body: 'The master design proposes testing fluorescence at different AHL concentrations, but does not report a completed dose-response curve. Subsequent assays test the reporter in the presence of PAO1 rather than establishing its response to a known concentration of synthetic 3-oxo-C12-HSL.',
            details: 'No EC50 or detection limit is available from the supplied records.',
            conclusion: 'We had a working assay concept, but no documented calibration of this specific circuit. We therefore advanced to organism-based qualitative testing without an established AHL response benchmark.'
          },
          learn: {
            subtitle: 'Identifying what fluorescence alone could not prove',
            body: 'Our design required a separate test to distinguish AHL-dependent induction from constitutive fluorescence, PAO1 background, and effects of mixed growth. We next used a plate streak assay to look for a spatial response near PAO1.',
            details: 'The later J23101–LasR-LVA design is a proposed alternative to the ProD–LasR module, not an implemented improvement documented here.',
            conclusion: 'The circuit architecture supplied the sensing hypothesis. The first experimental decision was to challenge it with a PAO1-facing assay.'
          },
          requests: [
            'Attachment slot — circuit and construct evidence: Use the verified plasmid map/sequence and, if useful, the May 17 Twist optimization screenshots; label the screenshots as a design workflow, not sequence verification.',
            'Design — authoritative circuit map: Supply the final plasmid map and sequence file, with promoter, RBS, LasR, terminator, pLasRV, sfGFP, backbone, resistance marker, and version name. Confirm whether J23101–LasR-LVA was only designed or was ever built.',
            'Build — verified strain provenance: Provide assembly or synthesis records, PCR/gel and sequencing results, and the host/colony identifier used in each assay. This resolves the pTwist/pSB1C3/pLas/pLasRV/pluxR naming conflict across pages.',
            'Test — reporter calibration: Provide raw and processed fluorescence and OD readings for known synthetic 3-oxo-C12-HSL concentrations, solvent-only control, measurement times, and independent cultures. Add a dose-response plot only if it was actually measured.',
            'Learn — revision rationale: Provide any construct changes made after the first readout, the observation that prompted each change, and the matching version/date. This determines whether a construction Iteration 2 exists.'
          ]
        },
        {
          name: 'Agar Streak Test',
          note: 'Agar Streak Test',
          heading: 'Testing direct contact on agar',
          status: '',
          approach: 'PAO1–Reporter *E. coli* Streak Assay',
          aim: 'We tested whether proximity to PAO1 produced a distinguishable fluorescent response in the engineered reporter.',
          design: {
            subtitle: 'Looking for a localized reporter response',
            body: 'We expected the reporter to fluoresce where it encountered AHL associated with PAO1. A spatial plate assay could provide a first qualitative indication before a quantitative liquid readout.',
            details: 'The record names a pTwist(MCm)-pLasRV-sfGFP reporter and the ProD–LasR/pLasRV–sfGFP circuit.',
            conclusion: 'We used spatial fluorescence as a preliminary readout of interaction with PAO1. This design alone could not establish that AHL caused the signal.'
          },
          build: {
            subtitle: 'Bringing the two organisms together',
            body: 'We prepared streak plates containing the reporter strain and PAO1 and photographed them under blue-light illumination. The available record includes plate images and labels for two controls, but does not fully document the streak geometry, inoculum, or construct verification.',
            details: 'The plate photographs are dated June 17, 2026.',
            conclusion: 'We obtained a qualitative plate readout. Its interpretation depends on confirmed plate labels and growth observations.'
          },
          test: {
            subtitle: 'Reading fluorescence beside possible growth interference',
            body: 'Some streaked regions appeared green under blue light, but the source record labels the assay unsuccessful. The images alone do not show that fluorescence was induced by PAO1-derived AHL or that both organisms grew comparably at the contact zone.',
            details: 'No quantified halo radius, fluorescence intensity, PAO1-only background measurement, or cell-viability comparison is supplied. The team note proposes that interaction between PAO1 and *E. coli* may have restricted reporter growth; this is an interpretation, not a demonstrated mechanism.',
            conclusion: 'We observed visible green regions but no interpretable, AHL-specific response. The assay exposed direct coculture as a possible confounder.'
          },
          learn: {
            subtitle: 'Reducing interference from direct contact',
            body: 'We proposed moving toward PAO1 supernatant or extracted signal to separate chemical exposure from organism-to-organism effects. A single- and a double-layer agar diffusion design were drafted, with the latter also proposing ALS-5-1 treatment to reduce available AHL; their result fields do not establish completed tests.',
            details: 'The proposed diffusion assays and ALS-5-1 comparison cannot be described as completed tests from these records.',
            conclusion: 'The next measurable question was whether the reporter responded in a better-controlled sample environment. The documented quantitative follow-up used liquid coculture, which still retained mixed-culture confounders.'
          },
          requests: [
            'Attachment slot — agar plate photos: Locate IMG_4195.jpeg, IMG_4194.jpeg, IMG_4196.jpeg, and IMG_4193.jpeg from the streak assay record. Place only images with confirmed condition labels in Build/Test; request the annotated originals if labels remain unclear.',
            'Design/Build — plate key: Provide the original streak layout, identities of Control 1 and Control 2, inoculum, medium, incubation conditions, number of independently prepared plates, and the exact reporter strain used.',
            'Test — labeled images and growth record: Provide original plate photos with each streak annotated, exposure/illumination settings, and any ordinary-light image or growth assessment. Include fluorescence or halo measurements if they were made.',
            'Learn — follow-up outcome: Confirm whether PAO1 supernatant extraction, single-layer diffusion, double-layer diffusion, or the ALS-5-1 comparison was actually performed. For completed work, provide the sample preparation, controls, results, and decision it led to; otherwise retain them as proposals.'
          ]
        },
        {
          name: 'Coculture Readout',
          note: 'Coculture Readout',
          heading: 'Quantifying the mixed-culture signal',
          status: '',
          approach: 'Liquid Coculture Fluorescence Assay with PAO1 and Reporter *E. coli*',
          aim: 'We measured whether a PAO1–reporter mixture showed fluorescence above controls and whether washing changed the ambiguous signal.',
          design: {
            subtitle: 'Comparing coculture with single-organism controls',
            body: 'We moved from plate images to a microplate readout and hypothesized that PAO1 would trigger a strong fluorescent signal in the engineered TOP10 reporter. We included PAO1 alone and reporter *E. coli* alone to interpret the mixture, plus a fluorescent *E. coli*–PAO1 positive control.',
            details: 'The experiment record states a target of more than 10,000 a.u. for a responsive culture. The four groups were DH5α/pSU-pLacI-sfGFP-B0015 + PAO1, PAO1 alone, TOP10/pTwist-pLasRV alone, and PAO1 + the TOP10 reporter. The reporter plasmid name differs within the document.',
            conclusion: 'The design established the comparisons needed to see whether the mixture exceeded its component controls. Fluorescence in a mixed culture would still require AHL-specific confirmation.'
          },
          build: {
            subtitle: 'Preparing the first liquid assay',
            body: 'We cultured the four groups overnight, measured their optical density, and read GFP-channel fluorescence on a SpectraMax M2/M2e reader. The record assigns six wells per group, A–F, across columns 1–4.',
            details: 'The recorded excitation/emission wavelengths are 495/510 nm. Reported group ODs are 2.0, 1.69, 1.49, and 1.96, respectively. The six wells are plate positions and do not by themselves establish six independent cultures.',
            conclusion: 'We obtained matched plate readings for the four comparison groups. Their mixed-culture OD values do not isolate the abundance of reporter *E. coli*.'
          },
          test: {
            subtitle: 'Visible green did not translate into specific activation',
            body: 'The mixture was described as visibly green, yet its reported mean fluorescence/OD was 172.3 a.u./OD, below reporter *E. coli* alone at 282.5 and far below the positive control at 5,529.7. PAO1 alone measured 67.0. Thus the mixture did not meet the stated strong-response expectation or exceed the reporter-only comparison.',
            details: 'Reported SDs for the four means are 406.8, 2.1, 22.4, and 5.1, respectively. These values normalize by total mixed-culture OD and cannot be interpreted as fluorescence per reporter cell. The record lists possible quenching, altered growth, PAO1 metabolism, pH, and medium effects; none was isolated by this assay.',
            conclusion: 'The measured signal challenged our PAO1-triggered fluorescence hypothesis in this setting. Visible green by itself was insufficient evidence of AHL-dependent induction.'
          },
          learn: {
            subtitle: 'Testing whether the culture medium masked fluorescence',
            body: 'Because the mixed-culture signal was lower than the reporter-only control, we chose to centrifuge overnight cultures and resuspend the pellets in ultrapure water before rereading them. This modification tested whether the surrounding medium contributed to the discrepancy.',
            details: 'Centrifugation and water resuspension changed the sample before measurement; they did not identify the source of the low mixture signal.',
            conclusion: 'The first assay identified a measurable problem rather than a validated detector. The second iteration focused on the influence of sample preparation.'
          },
          requests: [
            'Attachment slot — iteration 1 photos: Locate PAO1pLacI.jpg, PAO1.jpg, TOP10.jpg, and PAO1pLasRV.jpg from the v1 record. Confirm each photo matches the stated condition before displaying it.',
            'Both iterations — strain and replicate key: Confirm the precise construct and host used in v1 and v2, whether they were the same strain, the number of independent cultures, and which wells are technical repeats. This determines how the two iterations can be compared.',
            'Iteration 1, Build/Test — original plate file: Provide the SpectraMax export and the analysis workbook for the four groups, with well map, individual OD readings, RFU readings, calculation formulas, and definitions of the reported SD and P values. Clarify whether the listed group ODs are individual readings or means.'
          ]
        },
        {
          name: 'Resuspension Test',
          note: 'Resuspension Test',
          heading: 'Comparing unwashed and water-resuspended samples',
          status: '',
          approach: 'Liquid Coculture Fluorescence Assay with PAO1 and Reporter *E. coli*',
          aim: 'We measured whether a PAO1–reporter mixture showed fluorescence above controls and whether washing changed the ambiguous signal.',
          design: {
            subtitle: 'Isolating a sample-preparation effect',
            body: 'We retained the four comparison groups and added a washed, water-resuspended counterpart for each. If the medium were the dominant source of interference, the altered preparation might change the pattern of GFP-channel readings.',
            details: 'The record describes an overnight-culture readout both before and after centrifugation at 12,000 rpm for 5 min at room temperature, discarding supernatant, and resuspending the pellet in ultrapure water.',
            conclusion: 'This version changed how we read the sample, while preserving the PAO1 and reporter comparisons. It did not directly test AHL specificity.'
          },
          build: {
            subtitle: 'Running paired preparation conditions',
            body: 'We recorded three wells, A–C, for each of eight groups: the original four cultures and their resuspended counterparts. We measured OD and fluorescence using the same stated GFP-channel wavelengths, 495/510 nm.',
            details: 'Prewash ODs for the four original groups were 1.88, 1.80, 1.59, and 1.70; corresponding postwash ODs were 1.61, 1.62, 1.66, and 1.82. The record labels this as a double run but does not establish two independent biological replicates.',
            conclusion: 'We created a paired sample-preparation comparison. Replicate provenance and well mapping remain important for quantitative interpretation.'
          },
          test: {
            subtitle: 'Reading a persistent low coculture signal',
            body: 'The raw RFU table lists approximately 16,041–17,610 for column 1, 180–204 for column 2, 460–468 for column 3, and 320–346 for the PAO1–reporter mixture in column 4. After resuspension, corresponding column ranges are approximately 7,986–8,038, 36–44, 228–266, and 53–59 RFU. Under the recorded group-to-column map, the mixture again remained below the reporter-only control; washing did not reveal a strong coculture-specific signal.',
            details: 'The accompanying normalized statistics table assigns 104.9 to the positive control and 8,993.7 to reporter-only, which conflicts with the raw column pattern and listed ODs. We therefore do not use those normalized group means, SDs, or P values to quantify this iteration until the plate map and spreadsheet calculations are checked. Each column has three listed wells.',
            conclusion: 'The raw plate pattern does not support a strong PAO1-specific increase. The disputed normalization prevents a defensible effect size or significance claim.'
          },
          learn: {
            subtitle: 'Moving toward a defined chemical input',
            body: 'Our notes suggested that the experimental mixture might have a quenched or otherwise suppressed readout, but washing did not resolve the central ambiguity. We proposed testing synthetic 3-oxo-C12-HSL directly so we could distinguish failure to respond to the molecule from interference caused by PAO1 or mixed culture.',
            details: 'A later time-course design proposes solvent-matched concentrations of 0, 1, 10, and 100 nM, and 1 and 10 µM, with OD600 and fluorescence over time. It contains no recorded onset, plateau, EC50, or completed readout. A separate reflection mentions two AHL-addition attempts on August 1 and August 3 without visible response, with DMSO below 1%; their relationship to this construct is unconfirmed.',
            conclusion: 'We identified a controlled synthetic-AHL challenge as the next decisive test. The available documents do not establish an improved reporter or a validated detection range.'
          },
          requests: [
            'Attachment slot — iteration 2 plot: Locate image.png within the v2 record; withhold it as quantitative evidence until its group-to-well mapping is reconciled.',
            'Iteration 2, Build/Test — reconcile the well map: Provide the original eight-group plate layout and spreadsheet. Specifically resolve why the raw positive-control column is approximately 16,000–18,000 RFU while the statistics table labels its normalized mean 104.9 a.u./OD, and why reporter-only is labeled 8,993.7 a.u./OD. Confirm which columns were resuspended.',
            'Iteration 2, Build — washing details: Provide pellet resuspension volume, any OD adjustment, instrument settings, and whether prewash and postwash wells came from the same cultures.',
            'Learn/next iteration — defined AHL challenge: Provide the August 1 and August 3 AHL concentrations, solvent percentage and matched control, strain identifiers, raw readings/images, and decision after each attempt. If the later 0–10 µM time-course was run, provide the time series and dose-response analysis; otherwise it remains a proposed assay.'
          ]
        }
      ]
    }
  ];
  // Modules still being written up. They are deliberately kept off the
  // public page: four identical 待補 DBTL sections read as an unfinished site
  // rather than as work in progress. Add one back by giving it a record above
  // and adding its row to the rail in wiki/pages/engineering.html.
  // Module 3 -- 待補
  // Module 4 -- 待補
  var state = { module: 0, iteration: 0, stage: 0, rotation: 0, expanded: 0 };
  var items = Array.from(root.querySelectorAll('.engineering-module'));
  var tabs = Array.from(root.querySelectorAll('.engineering-stage-tab'));
  var arcs = Array.from(root.querySelectorAll('.engineering-arc'));
  var cycle = document.getElementById('engineering-cycle');
  var sheet = document.getElementById('engineering-sheet');
  var panels = stages.map(function (stage) { return document.getElementById('engineering-record-' + stage); });
  var labSlots = Array.from(root.querySelectorAll('.engineering-lab-slot'));
  var previous = document.getElementById('engineering-previous');
  var next = document.getElementById('engineering-next');
  var previousModule = document.getElementById('engineering-previous-module');
  var lastIteration = document.getElementById('engineering-last-iteration');
  var nextIteration = document.getElementById('engineering-next-iteration');
  var nextModule = document.getElementById('engineering-next-module');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var lastModule = 0;
  var transitionAnimations = [];
  var rail = root.querySelector('.engineering-rail');
  var sidebar = root.querySelector('.engineering-sidebar');
  var hero = document.querySelector('.engineering-hero');
  var currentRailScale = 1;
  var layoutFrame = 0;
  var settleUntil = 0;
  // The end of the notebook: the page nav under the sheet.
  var sheetEnd = root.querySelector('.engineering-page-nav') || sheet;
  var flipping = false;
  var spyPausedUntil = 0;
  var lastScrollY = window.scrollY;
  // Pull-to-turn: at the foot of the page, further scrolling builds up
  // tension that lifts the sheet; enough of it turns the page.
  var pull = 0;
  var pullThreshold = 600;
  var lastPullAt = 0;
  var pullFrame = 0;
  var touchY = null;
  function setText(id, value) { document.getElementById(id).textContent = value; }
  function title(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
  function padded(value) { return String(value).padStart(2, '0'); }
  function viewportHeight() { return window.visualViewport ? window.visualViewport.height : window.innerHeight; }
  // How much of the hero stays on screen once it sticks with the navbar away:
  // its full height less the strip that hides behind the navbar, plus the
  // blank lines kept above its label.
  function stuckHeroHeight() {
    var style = getComputedStyle(hero);
    return hero.offsetHeight - (parseFloat(style.getPropertyValue('--eng-nav-space')) || 0) + (parseFloat(style.getPropertyValue('--eng-stuck-reserve')) || 0);
  }

  function syncFloatingRail() {
    // The rail and the notebook are one group at one scale: the rail is never
    // shrunk or hidden. It floats below the hero; when it is taller than the
    // space there (a short window or a zoomed-in page) it first rides up with
    // the page and then holds with its bottom edge on the bottom of the
    // window, so every part of it stays reachable. On narrow phones it stays
    // above the article to preserve reading width.
    var viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var floating = window.innerWidth >= 576;
    currentRailScale = 1;
    rail.style.setProperty('--eng-rail-fit', 1);
    rail.classList.toggle('is-floating', floating);
    if (!floating) {
      sidebar.style.minHeight = '';
      return;
    }
    var height = rail.scrollHeight;
    var top = Math.max(12, hero.getBoundingClientRect().bottom + 16);
    if (top + height > viewportHeight - 16) {
      top = Math.max(viewportHeight - 16 - height, Math.min(top, sidebar.getBoundingClientRect().top));
    }
    // Pinned to the left edge of the content area.
    var left = sidebar.getBoundingClientRect().left;
    // Once the rail reaches the end of the notebook it scrolls away with it
    // instead of sliding over the footer.
    var contentBottom = root.getBoundingClientRect().bottom - parseFloat(getComputedStyle(root).paddingBottom);
    top = Math.min(top, contentBottom - height);
    rail.style.setProperty('--eng-rail-top', top + 'px');
    rail.style.setProperty('--eng-rail-left', left + 'px');
    sidebar.style.minHeight = height + 'px';
  }
  // Cycle button: on screens too narrow for the rail beside the notebook, a
  // small copy of the DBTL ring sits in the bottom-left corner. It follows the
  // big ring (the stage in progress lit, turning with each stage) and opens
  // the rail as a card over a scrim.
  var tocButton = document.createElement('button');
  tocButton.type = 'button';
  tocButton.className = 'engineering-toc-button';
  sidebar.id = sidebar.id || 'engineering-contents';
  tocButton.setAttribute('aria-controls', sidebar.id);
  tocButton.setAttribute('aria-expanded', 'false');
  // The button holds a true miniature of the cycle: the same element, built at
  // its full-screen size and scaled down, so arcs, stage labels and the centre
  // all keep the proportions they have on a wide screen.
  var miniStage = document.createElement('span');
  miniStage.className = 'engineering-toc-stage';
  var miniCycle = document.createElement('div');
  miniCycle.className = 'engineering-cycle engineering-toc-cycle';
  miniStage.appendChild(miniCycle);
  var tocMark = document.createElement('span');
  tocMark.className = 'engineering-toc-mark';
  tocMark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
  tocButton.append(miniStage, tocMark);
  // Mirror the live cycle exactly, then strip the copy of anything that would
  // answer to the page: ids, focus and pointer events all belong to the original.
  function syncTocCycle() {
    miniCycle.innerHTML = cycle.innerHTML;
    miniCycle.style.setProperty('--rotation', cycle.style.getPropertyValue('--rotation'));
    miniCycle.setAttribute('aria-hidden', 'true');
    // Ids belong to the original. The copy keeps a matching class instead, so
    // the miniature can still be styled on its own.
    miniCycle.querySelectorAll('[id]').forEach(function (node) {
      node.classList.add('engineering-toc-' + node.id.replace(/^engineering-/, ''));
      node.removeAttribute('id');
    });
    miniCycle.querySelectorAll('button').forEach(function (node) { node.tabIndex = -1; node.disabled = true; });
    miniCycle.querySelectorAll('[tabindex]').forEach(function (node) { node.tabIndex = -1; });
  }
  var tocScrim = document.createElement('div');
  tocScrim.className = 'engineering-toc-scrim';
  document.body.appendChild(tocScrim);
  document.body.appendChild(tocButton);
  function tocOpen() { return document.body.classList.contains('engineering-toc-open'); }
  function setToc(open) {
    document.body.classList.toggle('engineering-toc-open', open);
    tocButton.setAttribute('aria-expanded', String(open));
    tocButton.setAttribute('aria-label', open ? 'Close the DBTL cycle' : 'Open the DBTL cycle');
    syncTocCycle();
    if (open) {
      var first = sidebar.querySelector('button:not([hidden]):not(:disabled)');
      if (first) first.focus({ preventScroll: true });
    }
  }
  setToc(false);
  tocButton.addEventListener('click', function () { setToc(!tocOpen()); });
  tocScrim.addEventListener('click', function () { setToc(false); tocButton.focus({ preventScroll: true }); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && tocOpen()) { setToc(false); tocButton.focus({ preventScroll: true }); }
  });
  window.addEventListener('resize', function () { if (tocOpen() && window.innerWidth >= 576) setToc(false); });

  function scheduleLayout() {
    if (layoutFrame) return;
    layoutFrame = window.requestAnimationFrame(function () {
      layoutFrame = 0;
      syncFloatingRail();
      if (performance.now() < settleUntil) scheduleLayout();
    });
  }

  // The records carry two marks of their own: *word* for italics (species
  // names) and [S1]/[F1] to say which source a passage came from. The source
  // marks are kept in the text above so provenance is never lost, but they are
  // not shown on the page -- the attachments and sources are listed in full at
  // the foot of each iteration instead. Everything else is escaped, so the text
  // can never bring markup of its own into the page.
  function escapeText(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function formatRich(value) {
    return escapeText(value)
      .replace(/\s*\[[SF]\d+\]/g, '')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .trim();
  }
  function setRich(element, value) {
    if (element) element.innerHTML = formatRich(value);
  }

  // Fill all four stage sections of the sheet for the current iteration.
  function fillSheet() {
    var module = modules[state.module];
    var iteration = module.iterations[state.iteration];
    setRich(document.getElementById('engineering-context'), module.title);
    setRich(document.getElementById('engineering-question'), module.question);
    setText('engineering-iteration-name', 'Iteration ' + (state.iteration + 1) + ' · ' + iteration.name);
    // A status badge only where the record states one.
    var statusElement = document.getElementById('engineering-iteration-status');
    if (statusElement) {
      statusElement.hidden = !iteration.status;
      statusElement.textContent = iteration.status || '';
      statusElement.dataset.status = iteration.status === 'In progress' ? 'in-progress' : 'pending';
    }
    // One module can be pursued by several approaches in turn; each
    // iteration names the approach it tried and what it set out to measure.
    var approachElement = document.getElementById('engineering-approach');
    if (approachElement) {
      approachElement.hidden = !iteration.approach;
      approachElement.innerHTML = iteration.approach
        ? '<span class="engineering-approach-name">' + formatRich(iteration.approach) + '</span>' +
          (iteration.aim ? ' <span class="engineering-approach-aim">' + formatRich(iteration.aim) + '</span>' : '')
        : '';
    }
    // Two restrained illustrations live in the Design and Test heading rows.
    // Their motifs change only with the iteration; scrolling changes colour,
    // never their presence or position on the sheet.
    var motifs = ['ecoli', 'flask', 'petri', 'dna'];
    labSlots.forEach(function (slot) {
      var offset = slot.dataset.labStage === 'design' ? 2 : 0;
      var motif = motifs[(state.module + state.iteration + offset) % motifs.length];
      if (slot.dataset.labKind === motif) return;
      var source = document.getElementById('engineering-lab-icon-' + motif);
      slot.replaceChildren(source.content.cloneNode(true));
      slot.dataset.labKind = motif;
    });
    panels.forEach(function (panel, index) {
      var record = iteration[stages[index]];
      panel.classList.toggle('engineering-record--wrapped-figure', state.module === 0 && state.iteration === 0 && stages[index] === 'test');
      setRich(panel.querySelector('[data-field="title"]'), record.subtitle);
      setRich(panel.querySelector('[data-field="description"]'), record.body);
      panel.querySelector('[data-field="detail-label"]').textContent = 'DETAILS';
      setRich(panel.querySelector('[data-field="detail"]'), record.details);
      panel.querySelector('[data-field="outcome-label"]').textContent = 'CONCLUSION';
      setRich(panel.querySelector('[data-field="outcome"]'), record.conclusion);
      fillFigure(panel.querySelector('[data-field="figure"]'), record.figure);
    });
    var requestPanel = document.getElementById('engineering-requests');
    var requestList = document.getElementById('engineering-requests-list');
    var requests = state.module === 1 ? iteration.requests || [] : [];
    requestPanel.hidden = requests.length === 0;
    requestList.replaceChildren();
    requests.forEach(function (request) {
      var item = document.createElement('li');
      if (request.indexOf('Attachment slot') === 0) item.className = 'engineering-request-attachment';
      var marker = document.createElement('span');
      marker.className = 'engineering-request-box';
      marker.setAttribute('aria-hidden', 'true');
      var separator = request.indexOf(':');
      var text = document.createElement('span');
      var label = document.createElement('strong');
      label.textContent = request.slice(0, separator + 1);
      text.append(label, document.createTextNode(request.slice(separator + 1)));
      item.append(marker, text);
      requestList.appendChild(item);
    });
  }
  // A figure only appears once its image has been uploaded to the iGEM server;
  // until then the slot states plainly that the image is still missing, so an
  // empty space is never mistaken for evidence.
  function fillFigure(slot, figure) {
    if (!slot) return;
    slot.hidden = !figure;
    if (!figure) { slot.replaceChildren(); return; }
    var body;
    if (figure.src) {
      body = document.createElement('a');
      body.href = figure.src;
      body.target = '_blank';
      body.rel = 'noopener noreferrer';
      body.setAttribute('aria-label', 'Open full-size ' + figure.label + ' image');
      var image = document.createElement('img');
      image.src = figure.src;
      image.alt = figure.alt;
      image.loading = 'lazy';
      image.decoding = 'async';
      body.appendChild(image);
    } else {
      body = document.createElement('p');
      body.className = 'engineering-figure-missing';
      body.textContent = 'Image not uploaded yet — upload it with the iGEM uploads tool, then link it here.';
    }
    var caption = document.createElement('figcaption');
    caption.innerHTML = '<span class="engineering-figure-label">' + escapeText(figure.label) + '</span> ' + formatRich(figure.caption);
    slot.replaceChildren(body, caption);
  }

  function render(announce) {
    var moved = state.module !== lastModule;
    var oldPositions = [];
    if (moved) {
      transitionAnimations.forEach(function (animation) { animation.cancel(); });
      transitionAnimations = [];
      oldPositions = items.map(function (item) { return item.getBoundingClientRect().top; });
      items[state.module].querySelector('.engineering-cycle-slot').appendChild(cycle);
    }
    var module = modules[state.module];
    var stage = stages[state.stage];
    document.body.dataset.engineeringStage = stage;
    panels.forEach(function (panel, index) { panel.classList.toggle('is-current', index === state.stage); });
    // Turning pages within one module should feel continuous, so the
    // footer only shows on an module's last iteration.
    document.body.classList.toggle('engineering-footer-hidden', state.iteration + 1 < module.iterations.length);
    cycle.style.setProperty('--rotation', state.rotation + 'deg');
    setText('engineering-hero-stage', module.title);
    setText('engineering-hero-position', module.iterations[state.iteration].name + '・' + title(stage));
    setRich(document.getElementById('engineering-module-title'), module.title);
    setText('engineering-iteration-title', 'Iteration ' + (state.iteration + 1));
    setText('engineering-iteration-count', padded(state.iteration + 1) + ' / ' + padded(module.iterations.length));
    previous.disabled = state.iteration === 0;
    next.disabled = state.iteration === module.iterations.length - 1;
    previousModule.disabled = state.module === 0;
    lastIteration.disabled = state.iteration === 0;
    nextIteration.disabled = state.iteration === module.iterations.length - 1;
    nextModule.disabled = state.module === modules.length - 1;
    tabs.forEach(function (tab, index) {
      var current = index === state.stage;
      tab.classList.toggle('is-current', current);
      if (current) tab.setAttribute('aria-current', 'step');
      else tab.removeAttribute('aria-current');
      arcs[index].classList.toggle('is-current', current);
      if (current) arcs[index].setAttribute('aria-current', 'step');
      else arcs[index].removeAttribute('aria-current');
    });
    items.forEach(function (item, index) {
      var current = index === state.module;
      var expanded = index === state.expanded;
      var button = item.querySelector('.engineering-module-button');
      item.classList.toggle('is-current', current);
      button.hidden = current;
      button.setAttribute('aria-expanded', String(expanded));
      if (current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
      item.querySelector('.engineering-expand').textContent = expanded ? '−' : '+';
      setRich(item.querySelector('.engineering-module-title'), modules[index].title);
      item.querySelector('.engineering-iterations').hidden = !expanded;
      item.querySelectorAll('.engineering-iteration-button').forEach(function (iterationButton, iterationIndex) {
        var active = current && iterationIndex === state.iteration;
        iterationButton.classList.toggle('is-current', active);
        if (active) iterationButton.setAttribute('aria-current', 'step');
        else iterationButton.removeAttribute('aria-current');
        // A few words under each iteration, saying what that round tried.
        var note = iterationButton.querySelector('.engineering-iteration-note');
        if (note) note.textContent = (modules[index].iterations[iterationIndex] || {}).note || '';
      });
    });
    syncTocCycle();
    syncFloatingRail();
    scheduleLayout();
    if (moved && !reducedMotion.matches) {
      items.forEach(function (item, index) {
        var offset = (oldPositions[index] - item.getBoundingClientRect().top) / currentRailScale;
        if (Math.abs(offset) > 1) transitionAnimations.push(item.animate([
          { transform: 'translateY(' + offset + 'px)' }, { transform: 'translateY(0)' }
        ], { duration: 520, easing: 'cubic-bezier(.22,.8,.25,1)' }));
      });
      transitionAnimations.push(cycle.animate([
        { transform: 'scale(.68)', filter: 'brightness(.82)' },
        { transform: 'scale(1)', filter: 'brightness(1)' }
      ], { duration: 560, easing: 'cubic-bezier(.22,.8,.25,1)' }));
    }
    lastModule = state.module;
    if (announce) setText('engineering-announcement', module.name + ', Iteration ' + (state.iteration + 1) + ', ' + title(stage) + '.');
  }
  function selectStage(index, announce) {
    // The stages sit anticlockwise (D top, B left, T bottom, L right), so each
    // next stage waits on the left and a quarter turn clockwise brings it to
    // the top. Positive angles keep every transition clockwise.
    if (index === state.stage) return;
    state.rotation += ((index - state.stage + 4) % 4) * 90;
    state.stage = index;
    render(announce !== false);
  }
  function followingIteration() {
    if (state.iteration + 1 < modules[state.module].iterations.length) return { module: state.module, iteration: state.iteration + 1 };
    if (state.module + 1 < modules.length) return { module: state.module + 1, iteration: 0 };
    return null;
  }

  // Scroll so an element sits just below the hero. Scrolling down hides the
  // navbar, so the hero is then only its own height; scrolling up brings the
  // navbar back, so leave room for it too.
  var workspaceTop = sheet;
  function scrollTargetFor(element) {
    var elementTop = window.scrollY + element.getBoundingClientRect().top;
    var target = elementTop - stuckHeroHeight() - 16;
    if (target < window.scrollY) target = elementTop - hero.offsetHeight - 16;
    return Math.max(0, target);
  }
  // The ring, tabs and Continue buttons scroll to a stage within the sheet.
  // The stage is shown at once and the scroll-spy waits for the scroll to end,
  // so the ring does not spin through the stages it passes.
  function goToStage(index) {
    // Choosing a destination in the contents card closes it.
    if (tocOpen()) setToc(false);
    spyPausedUntil = performance.now() + 900;
    selectStage(index);
    window.scrollTo({ top: scrollTargetFor(index === 0 ? sheet : panels[index]), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }
  arcs.forEach(function (arc, index) {
    arc.addEventListener('click', function () { goToStage(index); });
    arc.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      goToStage(index);
    });
  });
  // An element's top in the viewport as laid out, ignoring the sheet's
  // page-turn transform, so the stage reads right while a page settles.
  function layoutTop(element) {
    var top = 0;
    for (var node = element; node; node = node.offsetParent) top += node.offsetTop;
    return top - window.scrollY;
  }
  // While reading, the stage whose section crosses the reading line (a third
  // of the way down below the hero) is the stage in progress.
  function spyStage() {
    if (flipping || performance.now() < spyPausedUntil) return;
    var heroBottom = hero.getBoundingClientRect().bottom;
    var line = heroBottom + (viewportHeight() - heroBottom) * .33;
    var index = 0;
    panels.forEach(function (panel, panelIndex) { if (layoutTop(panel) <= line) index = panelIndex; });
    if (sheetEnd.getBoundingClientRect().bottom <= viewportHeight()) index = 3;
    selectStage(index, false);
  }

  // Turning the page: the finished iteration lifts away, the view returns to
  // the top of the sheet, and the next iteration rises into place.
  function flipTo(target) {
    if (flipping || !target) return;
    if (tocOpen()) setToc(false);
    function apply() {
      state.module = target.module;
      state.iteration = target.iteration;
      state.expanded = target.module;
      fillSheet();
      selectStage(target.stage || 0);
      render(true);
      // 'instant', not 'auto': Bootstrap makes the page scroll smoothly by default.
      // A target stage, if given, opens the new page at that stage.
      // Land on the notebook heading, not wherever the last page was being
      // read, so a switch never drops the reader into the middle of new content.
      window.scrollTo({ top: scrollTargetFor(target.stage ? panels[target.stage] : workspaceTop), behavior: 'instant' });
      resetPull();
      // Reading continues from the new module's title.
      if (target.chosen) {
        var heading = document.getElementById('engineering-context');
        if (heading) heading.focus({ preventScroll: true });
      }
    }
    if (reducedMotion.matches) { apply(); return; }
    flipping = true;
    var sign = target.backward ? -1 : 1;
    sheet.getAnimations().forEach(function (animation) { animation.cancel(); });
    var liftedFrom = sheet.style.transform || 'none';
    var shadowFrom = sheet.style.boxShadow || '0 0 0 rgba(25, 62, 52, 0)';
    // A page turned by a button (not pulled) hinges where the reader is looking.
    if (!pull) sheet.style.transformOrigin = '50% ' + visibleEdge(sign > 0 ? 'bottom' : 'top') + 'px';
    // While it moves, the sheet reads as a sheet of paper.
    sheet.classList.add('is-turning');
    // Exit: the page peels off its hinge (forward: up and away; backward: down
    // and away), catching a deeper shadow before it clears.
    sheet.animate([
      { opacity: 1, transform: liftedFrom, boxShadow: shadowFrom },
      { opacity: 1, offset: .45, transform: 'perspective(1400px) rotateX(' + (sign * 30) + 'deg) translateY(' + (-sign * 150) + 'px) scale(.95)', boxShadow: '0 34px 70px rgba(25, 62, 52, .22)' },
      { opacity: 0, transform: 'perspective(1400px) rotateX(' + (sign * 62) + 'deg) translateY(' + (-sign * 340) + 'px) scale(.86)', boxShadow: '0 48px 90px rgba(25, 62, 52, 0)' }
    ], { duration: 520, easing: 'cubic-bezier(.45,0,.7,.35)', fill: 'forwards' }).finished.then(function () {
      // Clear the turned-away page first so the new page is measured flat
      // (all in one frame, so nothing flashes).
      sheet.getAnimations().forEach(function (animation) { animation.cancel(); });
      sheet.style.transform = '';
      sheet.style.boxShadow = '';
      apply();
      // Enter: the next page is laid down from underneath, hinged on the edge
      // the reader meets first, and settles with a small give.
      sheet.style.transformOrigin = '50% ' + visibleEdge(sign > 0 ? 'top' : 'bottom') + 'px';
      // Reading resumes as the new page settles, so scrolling on during it
      // still steps through Build and Test rather than skipping them.
      flipping = false;
      var enter = sheet.animate([
        { opacity: 0, transform: 'perspective(1400px) rotateX(' + (-sign * 14) + 'deg) translateY(' + (sign * 120) + 'px) scale(.94)', boxShadow: '0 40px 80px rgba(25, 62, 52, .16)' },
        { opacity: 1, offset: .55, transform: 'perspective(1400px) rotateX(' + (sign * 1.6) + 'deg) translateY(' + (-sign * 8) + 'px) scale(1.004)', boxShadow: '0 14px 34px rgba(25, 62, 52, .08)' },
        { opacity: 1, transform: 'none', boxShadow: '0 0 0 rgba(25, 62, 52, 0)' }
      ], { duration: 760, easing: 'cubic-bezier(.2,.75,.25,1)' });
      // The header's page line changes with the page, not a beat before it.
      [document.getElementById('engineering-hero-stage'), document.getElementById('engineering-hero-position')].forEach(function (element, order) {
        if (element) element.animate([
          { opacity: 0, transform: 'translateY(' + (sign * 14) + 'px)' },
          { opacity: 1, transform: 'none' }
        ], { duration: 460, delay: 60 + order * 70, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'backwards' });
      });
      enter.finished.then(settled, settled);
    }, function () { flipping = false; sheet.classList.remove('is-turning'); });
    function settled() {
      sheet.classList.remove('is-turning');
      sheet.style.transformOrigin = '';
    }
  }
  // Distance from the top of the sheet to the edge of the part of it in view
  // (under the header), so a turn hinges on screen wherever the reader is.
  function visibleEdge(edge) {
    var box = sheet.getBoundingClientRect();
    var top = Math.max(box.top, hero ? hero.getBoundingClientRect().bottom : 0);
    var bottom = Math.min(box.bottom, viewportHeight());
    var y = edge === 'top' ? top : bottom;
    return Math.round(Math.min(box.height, Math.max(0, y - box.top)));
  }
  // Pull-to-turn, both ways. `pull` is signed: positive builds at the foot of
  // the page towards the next page, negative at the very top towards the
  // previous one. Each further scroll adds tension (with resistance, so the
  // sheet moves less and less), a cue shows how close the turn is, and at the
  // threshold the page turns. Let go early and the sheet settles back;
  // scrolling the other way unwinds it quickly.
  function makeCue(extraClass) {
    var element = document.createElement('div');
    element.className = 'engineering-flip-cue' + (extraClass ? ' ' + extraClass : '');
    element.setAttribute('aria-hidden', 'true');
    element.innerHTML = '<span class="engineering-flip-cue-text"></span><span class="engineering-flip-cue-bar"><i></i></span>';
    return element;
  }
  var cue = makeCue();
  sheetEnd.parentNode.insertBefore(cue, sheetEnd.nextSibling);
  var cueText = cue.querySelector('.engineering-flip-cue-text');
  var cueUp = makeCue('is-top');
  sheet.parentNode.insertBefore(cueUp, sheet);
  var cueUpText = cueUp.querySelector('.engineering-flip-cue-text');
  var footer = document.querySelector('footer');
  // Forward tension starts once a quarter of the footer is in view; on pages
  // where the footer is hidden, at the very foot of the page.
  function atPageFoot() {
    if (footer && footer.offsetHeight) {
      var box = footer.getBoundingClientRect();
      if (box.top <= viewportHeight() - box.height / 4) return true;
    }
    return window.scrollY + viewportHeight() >= document.documentElement.scrollHeight - 2;
  }
  function atPageTop() { return window.scrollY <= 2; }
  function precedingIteration() {
    if (state.iteration > 0) return { module: state.module, iteration: state.iteration - 1 };
    if (state.module > 0) return { module: state.module - 1, iteration: modules[state.module - 1].iterations.length - 1 };
    return null;
  }
  function pageName(target) {
    return target.module === state.module ? 'Iteration ' + (target.iteration + 1)
      : modules[target.module].name + (target.iteration ? ' · Iteration ' + (target.iteration + 1) : '');
  }
  function drawPull() {
    var progress = Math.min(1, Math.abs(pull) / pullThreshold);
    var backward = pull < 0;
    // A steep curve: the sheet answers the very first scroll, then stiffens.
    var tension = (1 - Math.exp(-4 * progress)) / (1 - Math.exp(-4));
    var moved = progress && !reducedMotion.matches;
    var sign = backward ? -1 : 1;
    // Forward the sheet tips up from its bottom edge; backward it tips down
    // from its top edge.
    sheet.style.transformOrigin = backward ? '50% 0%' : '50% 100%';
    sheet.style.transform = moved
      ? 'perspective(1400px) rotateX(' + (sign * 12 * tension).toFixed(2) + 'deg) translateY(' + (-sign * 80 * tension).toFixed(1) + 'px) scale(' + (1 - .03 * tension).toFixed(4) + ')'
      : '';
    // One soft shadow under the whole page (its box), not one per card.
    sheet.style.boxShadow = moved ? '0 ' + (20 * tension).toFixed(1) + 'px ' + (44 * tension).toFixed(1) + 'px rgba(25, 62, 52, ' + (.12 * tension).toFixed(3) + ')' : '';
    cue.style.setProperty('--flip-progress', (backward ? 0 : progress).toFixed(3));
    cue.classList.toggle('is-pulling', !backward && progress > 0);
    cueUp.style.setProperty('--flip-progress', (backward ? progress : 0).toFixed(3));
    cueUp.classList.toggle('is-pulling', backward && progress > 0);
  }
  function syncCue() {
    var next = followingIteration();
    var previous = precedingIteration();
    cue.classList.toggle('is-ready', Boolean(next) && atPageFoot());
    if (next) cueText.textContent = 'Keep scrolling to turn to ' + pageName(next);
    if (previous) cueUpText.textContent = 'Keep scrolling up to return to ' + pageName(previous);
  }
  function resetPull() {
    pull = 0;
    drawPull();
    syncCue();
  }
  function settlePull() {
    pullFrame = 0;
    if (flipping) return;
    if (performance.now() - lastPullAt > 140) pull *= .86;
    if (Math.abs(pull) < 1) { resetPull(); return; }
    drawPull();
    pullFrame = requestAnimationFrame(settlePull);
  }
  // delta > 0 is a scroll down, delta < 0 a scroll up.
  function addPull(delta) {
    if (flipping || !delta) return;
    if (delta > 0) {
      if (pull < 0) pull = Math.min(0, pull + delta * 3);
      else if (followingIteration() && atPageFoot()) pull += delta;
      else return;
    } else {
      if (pull > 0) pull = Math.max(0, pull + delta * 3);
      else if (precedingIteration() && atPageTop()) pull += delta;
      else return;
    }
    lastPullAt = performance.now();
    syncCue();
    if (pull >= pullThreshold) { flipTo(followingIteration()); return; }
    if (pull <= -pullThreshold) {
      var previous = precedingIteration();
      // Going back lands at the end of the previous page, where it was left.
      previous.stage = 3;
      previous.backward = true;
      flipTo(previous);
      return;
    }
    drawPull();
    if (!pullFrame) pullFrame = requestAnimationFrame(settlePull);
  }

  items.forEach(function (item, index) {
    item.querySelector('.engineering-module-button').addEventListener('click', function () {
      state.expanded = state.expanded === index ? null : index;
      if (state.module !== index) flipTo({ module: index, iteration: 0, chosen: true });
      else render(true);
    });
    item.querySelectorAll('.engineering-iteration-button').forEach(function (button, iterationIndex) {
      button.addEventListener('click', function () {
        if (state.module === index && state.iteration === iterationIndex) goToStage(0);
        else flipTo({ module: index, iteration: iterationIndex, chosen: true });
      });
    });
  });
  // The ring is a read-out, not a control: it turns to show the stage being
  // read, but neither the arcs nor the labels can be clicked. Stages are
  // reached by reading on, or by the links the page already carries
  // (/engineering#build and the iteration list in the rail).
  function moveIteration(offset) {
    var target = state.iteration + offset;
    if (target < 0 || target >= modules[state.module].iterations.length) return;
    flipTo({ module: state.module, iteration: target, chosen: true });
  }
  previous.addEventListener('click', function () { moveIteration(-1); });
  next.addEventListener('click', function () { moveIteration(1); });
  previousModule.addEventListener('click', function () {
    if (state.module > 0) flipTo({ module: state.module - 1, iteration: 0, chosen: true });
  });
  lastIteration.addEventListener('click', function () { moveIteration(-1); });
  nextIteration.addEventListener('click', function () { moveIteration(1); });
  nextModule.addEventListener('click', function () {
    if (state.module + 1 < modules.length) flipTo({ module: state.module + 1, iteration: 0, chosen: true });
  });
  // Preserve links from the original template, e.g. /engineering#build.
  function fromHash() {
    var index = stages.indexOf(window.location.hash.slice(1).toLowerCase());
    if (index !== -1) goToStage(index);
  }
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('scroll', function () {
    scheduleLayout();
    spyStage();
    syncCue();
    lastScrollY = window.scrollY;
  }, { passive: true });
  // At the very bottom of the page the window cannot scroll any further, so
  // the wheel and touch gestures themselves signal the intent to keep going.
  window.addEventListener('wheel', function (event) {
    var delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewportHeight() : 1);
    addPull(delta);
  }, { passive: true });
  window.addEventListener('touchstart', function (event) { touchY = event.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', function (event) {
    if (touchY === null) return;
    var y = event.touches[0].clientY;
    addPull((touchY - y) * 2.2);
    touchY = y;
  }, { passive: true });
  window.addEventListener('touchend', function () { touchY = null; }, { passive: true });
  window.addEventListener('keydown', function (event) {
    if (tocOpen() || (event.target.closest && event.target.closest('input, textarea, select, [contenteditable]'))) return;
    if (event.key === 'ArrowDown' || event.key === 'PageDown' || (event.key === ' ' && !event.shiftKey)) addPull(160);
    else if (event.key === 'ArrowUp' || event.key === 'PageUp' || (event.key === ' ' && event.shiftKey)) addPull(-160);
  });
  window.addEventListener('resize', scheduleLayout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', scheduleLayout);
  // Follow the navbar's existing hide-on-down / reveal-on-up behavior.
  new MutationObserver(function () {
    settleUntil = performance.now() + 360;
    scheduleLayout();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  var layoutObserver = new ResizeObserver(scheduleLayout);
  layoutObserver.observe(hero);
  layoutObserver.observe(rail);
  layoutObserver.observe(root);
  fillSheet();
  render(false);
  fromHash();
})();
