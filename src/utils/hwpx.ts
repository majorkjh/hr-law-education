import { DocumentData, CeremonyRow } from '../types';
import { createZip, readZip } from './zip';

export function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an HWPX binary (ZIP file) complying strictly with Hancom HWPX specification.
 */
export function generateHwpx(data: DocumentData): Uint8Array {
  const title = (data.title || '우체국 문화전 수상자 시상식 계획').trim();

  // 1. mimetype (MUST be first entry, uncompressed application/hwp+zip)
  const mimetype = 'application/hwp+zip';

  // 2. version.xml (tagetApplication="WORDPROCESSOR" - exact spelling)
  const versionXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hv:HCFVersion xmlns:hv="http://www.hancom.co.kr/hwpml/2011/version" tagetApplication="WORDPROCESSOR" major="5" minor="0" micro="0" buildNumber="1"/>`;

  // 3. settings.xml
  const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ha:HWPApplicationSetting xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app">
  <ha:CaretPosition listIDRef="0" paraIDRef="0" pos="0"/>
</ha:HWPApplicationSetting>`;

  // 4. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ocf:container xmlns:ocf="urn:oasis:names:tc:opendocument:xmlns:container">
  <ocf:rootfiles>
    <ocf:rootfile full-path="Contents/content.hpf" media-type="application/hwp+zip"/>
  </ocf:rootfiles>
</ocf:container>`;

  // 5. META-INF/manifest.xml
  const manifestXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<odf:manifest xmlns:odf="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <odf:file-entry odf:full-path="/" odf:media-type="application/hwp+zip"/>
  <odf:file-entry odf:full-path="Contents/content.hpf" odf:media-type="application/x-hwp-hpf"/>
  <odf:file-entry odf:full-path="Contents/header.xml" odf:media-type="application/x-hwp-header+xml"/>
  <odf:file-entry odf:full-path="Contents/section0.xml" odf:media-type="application/x-hwp-section+xml"/>
  <odf:file-entry odf:full-path="settings.xml" odf:media-type="application/xml"/>
</odf:manifest>`;

  // 6. Contents/content.hpf
  const contentHpf = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<opf:package xmlns:opf="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
  <opf:metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>ko</dc:language>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="header" href="header.xml" media-type="application/x-hwp-header+xml"/>
    <opf:item id="section0" href="section0.xml" media-type="application/x-hwp-section+xml"/>
    <opf:item id="settings" href="../settings.xml" media-type="application/xml"/>
  </opf:manifest>
  <opf:spine>
    <opf:itemref idref="header"/>
    <opf:itemref idref="section0"/>
  </opf:spine>
</opf:package>`;

  // 7. Contents/header.xml
  const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hh:head xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head"
         xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core"
         xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hh:beginNum page="1" footnote="1" endnote="1" pic="1" tbl="1" equation="1"/>
  <hh:refList>
    <hh:fontfaces itemCnt="7">
      <hh:fontface lang="hangul" fontCnt="1">
        <hh:font id="0" face="바탕" type="TTF" isEmbedded="0"/>
      </hh:fontface>
      <hh:fontface lang="latin" fontCnt="1">
        <hh:font id="0" face="Batang" type="TTF" isEmbedded="0"/>
      </hh:fontface>
      <hh:fontface lang="hanja" fontCnt="1">
        <hh:font id="0" face="바탕" type="TTF" isEmbedded="0"/>
      </hh:fontface>
      <hh:fontface lang="japanese" fontCnt="1">
        <hh:font id="0" face="바탕" type="TTF" isEmbedded="0"/>
      </hh:fontface>
      <hh:fontface lang="other" fontCnt="1">
        <hh:font id="0" face="바탕" type="TTF" isEmbedded="0"/>
      </hh:fontface>
      <hh:fontface lang="symbol" fontCnt="1">
        <hh:font id="0" face="바탕" type="TTF" isEmbedded="0"/>
      </hh:fontface>
      <hh:fontface lang="user" fontCnt="1">
        <hh:font id="0" face="바탕" type="TTF" isEmbedded="0"/>
      </hh:fontface>
    </hh:fontfaces>
    <hh:borderFills itemCnt="3">
      <hh:borderFill id="1" backSlash="NONE" slash="NONE">
        <hh:leftBorder type="NONE" width="0.1 mm" color="#000000"/>
        <hh:rightBorder type="NONE" width="0.1 mm" color="#000000"/>
        <hh:topBorder type="NONE" width="0.1 mm" color="#000000"/>
        <hh:bottomBorder type="NONE" width="0.1 mm" color="#000000"/>
      </hh:borderFill>
      <hh:borderFill id="2" backSlash="NONE" slash="NONE">
        <hh:leftBorder type="SOLID" width="0.12 mm" color="#000000"/>
        <hh:rightBorder type="SOLID" width="0.12 mm" color="#000000"/>
        <hh:topBorder type="SOLID" width="0.12 mm" color="#000000"/>
        <hh:bottomBorder type="SOLID" width="0.12 mm" color="#000000"/>
      </hh:borderFill>
      <hh:borderFill id="3" backSlash="NONE" slash="NONE">
        <hh:leftBorder type="SOLID" width="0.12 mm" color="#000000"/>
        <hh:rightBorder type="SOLID" width="0.12 mm" color="#000000"/>
        <hh:topBorder type="SOLID" width="0.12 mm" color="#000000"/>
        <hh:bottomBorder type="SOLID" width="0.12 mm" color="#000000"/>
        <hh:fillBrush>
          <hc:winBrush faceColor="#EAEAEA" hatchColor="#FF000000" alpha="0"/>
        </hh:fillBrush>
      </hh:borderFill>
    </hh:borderFills>
    <hh:charProperties itemCnt="5">
      <!-- 0: 본문 12pt -->
      <hh:charPr id="0" height="1200" textColor="#000000" shadeColor="NONE" useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="1">
        <hh:fontRef hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:ratio hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:spacing hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:relSz hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:offset hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
      </hh:charPr>
      <!-- 1: 제목 19pt 굵게 -->
      <hh:charPr id="1" height="1900" textColor="#000000" shadeColor="NONE" useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="1">
        <hh:fontRef hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:ratio hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:spacing hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:relSz hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:offset hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:bold/>
      </hh:charPr>
      <!-- 2: 소제목 14pt 굵게 -->
      <hh:charPr id="2" height="1400" textColor="#000000" shadeColor="NONE" useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="1">
        <hh:fontRef hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:ratio hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:spacing hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:relSz hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:offset hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:bold/>
      </hh:charPr>
      <!-- 3: 표머리 11pt 굵게 -->
      <hh:charPr id="3" height="1100" textColor="#000000" shadeColor="NONE" useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="1">
        <hh:fontRef hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:ratio hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:spacing hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:relSz hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:offset hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:bold/>
      </hh:charPr>
      <!-- 4: 표본문 11pt 보통 -->
      <hh:charPr id="4" height="1100" textColor="#000000" shadeColor="NONE" useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="1">
        <hh:fontRef hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:ratio hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:spacing hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:relSz hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:offset hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
      </hh:charPr>
    </hh:charProperties>
    <hh:tabProperties itemCnt="1">
      <hh:tabPr id="0" autoTabLeft="0" autoTabRight="0"/>
    </hh:tabProperties>
    <hh:paraProperties itemCnt="7">
      <!-- 0: 기본 본문 -->
      <hh:paraPr id="0" tabPrIDRef="0" align="JUSTIFY" headingType="NONE" headingIDRef="0" breakType="NONE">
        <hh:align horizontal="JUSTIFY" vertical="BASELINE"/>
        <hh:lineSpacing type="PERCENT" value="160"/>
        <hh:margin left="0" right="0" indent="0" prev="0" next="0"/>
      </hh:paraPr>
      <!-- 1: 가운데 (제목) -->
      <hh:paraPr id="1" tabPrIDRef="0" align="CENTER" headingType="NONE" headingIDRef="0" breakType="NONE">
        <hh:align horizontal="CENTER" vertical="BASELINE"/>
        <hh:lineSpacing type="PERCENT" value="160"/>
        <hh:margin left="0" right="0" indent="0" prev="800" next="800"/>
      </hh:paraPr>
      <!-- 2: 소제목 -->
      <hh:paraPr id="2" tabPrIDRef="0" align="LEFT" headingType="NONE" headingIDRef="0" breakType="NONE">
        <hh:align horizontal="LEFT" vertical="BASELINE"/>
        <hh:lineSpacing type="PERCENT" value="160"/>
        <hh:margin left="0" right="0" indent="0" prev="700" next="300"/>
      </hh:paraPr>
      <!-- 3: 항목 (내어쓰기) -->
      <hh:paraPr id="3" tabPrIDRef="0" align="JUSTIFY" headingType="NONE" headingIDRef="0" breakType="NONE">
        <hh:align horizontal="JUSTIFY" vertical="BASELINE"/>
        <hh:lineSpacing type="PERCENT" value="160"/>
        <hh:margin left="2000" right="0" indent="-2000" prev="0" next="150"/>
      </hh:paraPr>
      <!-- 4: 하위항목 (내어쓰기) -->
      <hh:paraPr id="4" tabPrIDRef="0" align="JUSTIFY" headingType="NONE" headingIDRef="0" breakType="NONE">
        <hh:align horizontal="JUSTIFY" vertical="BASELINE"/>
        <hh:lineSpacing type="PERCENT" value="160"/>
        <hh:margin left="3800" right="0" indent="-1800" prev="0" next="150"/>
      </hh:paraPr>
      <!-- 5: 표안 가운데 -->
      <hh:paraPr id="5" tabPrIDRef="0" align="CENTER" headingType="NONE" headingIDRef="0" breakType="NONE">
        <hh:align horizontal="CENTER" vertical="CENTER"/>
        <hh:lineSpacing type="PERCENT" value="130"/>
        <hh:margin left="0" right="0" indent="0" prev="0" next="0"/>
      </hh:paraPr>
      <!-- 6: 표안 왼쪽 -->
      <hh:paraPr id="6" tabPrIDRef="0" align="LEFT" headingType="NONE" headingIDRef="0" breakType="NONE">
        <hh:align horizontal="LEFT" vertical="CENTER"/>
        <hh:lineSpacing type="PERCENT" value="130"/>
        <hh:margin left="400" right="400" indent="0" prev="0" next="0"/>
      </hh:paraPr>
    </hh:paraProperties>
    <hh:styles itemCnt="1">
      <hh:style id="0" type="PARA" name="바탕글" engName="Normal" paraPrIDRef="0" charPrIDRef="0" nextStyleIDRef="0"/>
    </hh:styles>
  </hh:refList>
</hh:head>`;

  // 8. Contents/section0.xml
  let pIdCounter = 0;
  const nextPId = () => `${pIdCounter++}`;

  const paragraphsXml: string[] = [];

  // Title paragraph with secPr and colPr inside the first run
  const titlePId = nextPId();
  paragraphsXml.push(`  <hp:p id="${titlePId}" paraPrIDRef="1" styleIDRef="0" pageBreak="0" columnBreak="0">
    <hp:run charPrIDRef="1">
      <hp:secPr id="0" textDirection="0" spacePr="0" tabPr="0">
        <hp:grid char="0" line="0"/>
        <hp:startNum pageStartsOn="BOTH" page="1" pic="1" tbl="1" equation="1"/>
        <hp:visibility hideHeader="0" hideFooter="0" hideMasterPage="0" border="SHOW" fill="SHOW" pageNum="SHOW"/>
        <hp:lineNumber restartType="NEW_PAGE" countBy="1" distance="0" startNumber="1"/>
        <hp:pagePr width="59528" height="84186" paddingLeft="5669" paddingRight="5669" paddingTop="5669" paddingBottom="5669" headerLen="0" footerLen="0" gutter="0" landscape="WIDELY"/>
        <hp:footNotePr/>
        <hp:endNotePr/>
        <hp:pageBorderFill type="BOTH" borderFillIDRef="1" textBorder="0" headerInside="0" footerInside="0" fillArea="PAPER"/>
      </hp:secPr>
      <hp:ctrl>
        <hp:colPr id="0" type="NEWSPAPER" layout="LEFT" colCount="1" sameSz="1" sameGap="0"/>
      </hp:ctrl>
      <hp:t>${escapeXml(title)}</hp:t>
    </hp:run>
  </hp:p>`);

  // Empty separator paragraph
  paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0"><hp:run charPrIDRef="0"><hp:t></hp:t></hp:run></hp:p>`);

  // Helper for item list parsing
  const addItems = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const isSub = line.startsWith('-');
      const rawText = line.replace(/^[○•\-\*\s]+/, '').trim();
      const bullet = isSub ? `- ${rawText}` : `○ ${rawText}`;
      const paraPrRef = isSub ? '4' : '3';
      paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="${paraPrRef}" styleIDRef="0" pageBreak="0" columnBreak="0">
    <hp:run charPrIDRef="0"><hp:t>${escapeXml(bullet)}</hp:t></hp:run>
  </hp:p>`);
    }
  };

  // 1. 목적 (Exclude if empty)
  if (data.purpose && data.purpose.trim()) {
    paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="2" styleIDRef="0" pageBreak="0" columnBreak="0">
    <hp:run charPrIDRef="2"><hp:t>1. 목적</hp:t></hp:run>
  </hp:p>`);
    addItems(data.purpose);
    paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0"><hp:run charPrIDRef="0"><hp:t></hp:t></hp:run></hp:p>`);
  }

  // 2. 개요 (Exclude if all empty)
  const ov = data.overview;
  const hasOverview = ov.eventName?.trim() || ov.dateTime?.trim() || ov.location?.trim() ||
    ov.target?.trim() || ov.awardeeCount?.trim() || ov.attendeeCount?.trim() ||
    ov.host?.trim() || ov.extra?.trim();

  if (hasOverview) {
    paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="2" styleIDRef="0" pageBreak="0" columnBreak="0">
    <hp:run charPrIDRef="2"><hp:t>2. 개요</hp:t></hp:run>
  </hp:p>`);

    const addOverviewField = (label: string, value: string) => {
      if (!value || !value.trim()) return;
      paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="3" styleIDRef="0" pageBreak="0" columnBreak="0">
    <hp:run charPrIDRef="0"><hp:t>${escapeXml(`○ ${label} : ${value.trim()}`)}</hp:t></hp:run>
  </hp:p>`);
    };

    addOverviewField('행사명', ov.eventName);
    addOverviewField('일시', ov.dateTime);
    addOverviewField('장소', ov.location);
    addOverviewField('대상', ov.target);
    addOverviewField('수상 인원', ov.awardeeCount);
    addOverviewField('참석 예정', ov.attendeeCount);
    addOverviewField('주최 · 주관', ov.host);

    if (ov.extra && ov.extra.trim()) {
      addItems(ov.extra);
    }
    paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0"><hp:run charPrIDRef="0"><hp:t></hp:t></hp:run></hp:p>`);
  }

  // 3. 세부내용 (Exclude if empty)
  if (data.details && data.details.trim()) {
    paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="2" styleIDRef="0" pageBreak="0" columnBreak="0">
    <hp:run charPrIDRef="2"><hp:t>3. 세부내용</hp:t></hp:run>
  </hp:p>`);
    addItems(data.details);
    paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0"><hp:run charPrIDRef="0"><hp:t></hp:t></hp:run></hp:p>`);
  }

  // 4. 시상식 순서 (Table with sum of cols = 48190: 7000 / 28190 / 13000)
  const validRows = (data.ceremonyRows || []).filter(r => r.time.trim() || r.content.trim() || r.remarks.trim());
  if (validRows.length > 0) {
    paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="2" styleIDRef="0" pageBreak="0" columnBreak="0">
    <hp:run charPrIDRef="2"><hp:t>4. 시상식 순서</hp:t></hp:run>
  </hp:p>`);

    const tablePId = nextPId();
    const tableId = `tbl_${pIdCounter++}`;
    const rowCount = validRows.length + 1;

    let trsXml = '';

    // Header Row (borderFillIDRef="3" with gray fill)
    trsXml += `        <hp:tr>
          <hp:tc name="" header="1" hasMargin="0" protect="0" editable="0" dirty="0" borderFillIDRef="3">
            <hp:cellAddr colAddr="0" rowAddr="0"/>
            <hp:cellSpan colSpan="1" rowSpan="1"/>
            <hp:cellSz width="7000" height="850"/>
            <hp:cellMargin left="141" right="141" top="141" bottom="141"/>
            <hp:subList id="0" textDirection="0" lineWrap="BREAK" vertAlign="CENTER">
              <hp:p id="${nextPId()}" paraPrIDRef="5" styleIDRef="0">
                <hp:run charPrIDRef="3"><hp:t>시 간</hp:t></hp:run>
              </hp:p>
            </hp:subList>
          </hp:tc>
          <hp:tc name="" header="1" hasMargin="0" protect="0" editable="0" dirty="0" borderFillIDRef="3">
            <hp:cellAddr colAddr="1" rowAddr="0"/>
            <hp:cellSpan colSpan="1" rowSpan="1"/>
            <hp:cellSz width="28190" height="850"/>
            <hp:cellMargin left="141" right="141" top="141" bottom="141"/>
            <hp:subList id="0" textDirection="0" lineWrap="BREAK" vertAlign="CENTER">
              <hp:p id="${nextPId()}" paraPrIDRef="5" styleIDRef="0">
                <hp:run charPrIDRef="3"><hp:t>내 용</hp:t></hp:run>
              </hp:p>
            </hp:subList>
          </hp:tc>
          <hp:tc name="" header="1" hasMargin="0" protect="0" editable="0" dirty="0" borderFillIDRef="3">
            <hp:cellAddr colAddr="2" rowAddr="0"/>
            <hp:cellSpan colSpan="1" rowSpan="1"/>
            <hp:cellSz width="13000" height="850"/>
            <hp:cellMargin left="141" right="141" top="141" bottom="141"/>
            <hp:subList id="0" textDirection="0" lineWrap="BREAK" vertAlign="CENTER">
              <hp:p id="${nextPId()}" paraPrIDRef="5" styleIDRef="0">
                <hp:run charPrIDRef="3"><hp:t>담당 · 비고</hp:t></hp:run>
              </hp:p>
            </hp:subList>
          </hp:tc>
        </hp:tr>\n`;

    // Data Rows (borderFillIDRef="2" with solid black border)
    validRows.forEach((row, idx) => {
      const rowAddr = idx + 1;
      trsXml += `        <hp:tr>
          <hp:tc name="" header="0" hasMargin="0" protect="0" editable="0" dirty="0" borderFillIDRef="2">
            <hp:cellAddr colAddr="0" rowAddr="${rowAddr}"/>
            <hp:cellSpan colSpan="1" rowSpan="1"/>
            <hp:cellSz width="7000" height="800"/>
            <hp:cellMargin left="141" right="141" top="141" bottom="141"/>
            <hp:subList id="0" textDirection="0" lineWrap="BREAK" vertAlign="CENTER">
              <hp:p id="${nextPId()}" paraPrIDRef="5" styleIDRef="0">
                <hp:run charPrIDRef="4"><hp:t>${escapeXml(row.time)}</hp:t></hp:run>
              </hp:p>
            </hp:subList>
          </hp:tc>
          <hp:tc name="" header="0" hasMargin="0" protect="0" editable="0" dirty="0" borderFillIDRef="2">
            <hp:cellAddr colAddr="1" rowAddr="${rowAddr}"/>
            <hp:cellSpan colSpan="1" rowSpan="1"/>
            <hp:cellSz width="28190" height="800"/>
            <hp:cellMargin left="141" right="141" top="141" bottom="141"/>
            <hp:subList id="0" textDirection="0" lineWrap="BREAK" vertAlign="CENTER">
              <hp:p id="${nextPId()}" paraPrIDRef="6" styleIDRef="0">
                <hp:run charPrIDRef="4"><hp:t>${escapeXml(row.content)}</hp:t></hp:run>
              </hp:p>
            </hp:subList>
          </hp:tc>
          <hp:tc name="" header="0" hasMargin="0" protect="0" editable="0" dirty="0" borderFillIDRef="2">
            <hp:cellAddr colAddr="2" rowAddr="${rowAddr}"/>
            <hp:cellSpan colSpan="1" rowSpan="1"/>
            <hp:cellSz width="13000" height="800"/>
            <hp:cellMargin left="141" right="141" top="141" bottom="141"/>
            <hp:subList id="0" textDirection="0" lineWrap="BREAK" vertAlign="CENTER">
              <hp:p id="${nextPId()}" paraPrIDRef="5" styleIDRef="0">
                <hp:run charPrIDRef="4"><hp:t>${escapeXml(row.remarks)}</hp:t></hp:run>
              </hp:p>
            </hp:subList>
          </hp:tc>
        </hp:tr>\n`;
    });

    paragraphsXml.push(`  <hp:p id="${tablePId}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0">
    <hp:run charPrIDRef="4">
      <hp:tbl id="${tableId}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" lock="0" dropCapstyle="None" pageBreak="0" repeatHeader="1" rowCnt="${rowCount}" colCnt="3" cellSpacing="0" borderFillIDRef="2">
        <hp:sz width="48190" height="0" widthRelTo="ABSOLUTE" heightRelTo="ABSOLUTE" protect="0"/>
        <hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="PARA" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>
        <hp:outMargin left="0" right="0" top="141" bottom="141"/>
        <hp:inMargin left="141" right="141" top="141" bottom="141"/>
${trsXml}      </hp:tbl>
      <hp:t/>
    </hp:run>
  </hp:p>`);
    paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0"><hp:run charPrIDRef="0"><hp:t></hp:t></hp:run></hp:p>`);
  }

  // 5. 향후 계획 (Exclude if empty)
  if (data.futurePlans && data.futurePlans.trim()) {
    paragraphsXml.push(`  <hp:p id="${nextPId()}" paraPrIDRef="2" styleIDRef="0" pageBreak="0" columnBreak="0">
    <hp:run charPrIDRef="2"><hp:t>5. 향후 계획</hp:t></hp:run>
  </hp:p>`);
    addItems(data.futurePlans);
  }

  const section0Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hs:sec xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app"
        xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"
        xmlns:hp10="http://www.hancom.co.kr/hwpml/2011/paragraph/10"
        xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section"
        xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core"
        xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head"
        xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history"
        xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page"
        xmlns:hpf="http://www.idpf.org/2007/opf"
        xmlns:dc="http://purl.org/dc/elements/1.1/">
${paragraphsXml.join('\n')}
</hs:sec>`;

  // Build ZIP with mandatory exact entry order
  const zipEntries = [
    { name: 'mimetype', data: mimetype },
    { name: 'version.xml', data: versionXml },
    { name: 'settings.xml', data: settingsXml },
    { name: 'META-INF/container.xml', data: containerXml },
    { name: 'META-INF/manifest.xml', data: manifestXml },
    { name: 'Contents/content.hpf', data: contentHpf },
    { name: 'Contents/header.xml', data: headerXml },
    { name: 'Contents/section0.xml', data: section0Xml },
  ];

  return createZip(zipEntries);
}

/**
 * Parses an HWPX file and extracts DocumentData.
 */
export async function parseHwpx(arrayBuffer: ArrayBuffer): Promise<{ data: DocumentData; recognizedSectionsCount: number }> {
  const files = await readZip(arrayBuffer);
  const textDecoder = new TextDecoder('utf-8');
  const parser = new DOMParser();

  // 1. Try reading title from content.hpf if available
  let metaTitle = '';
  for (const [name, bytes] of files.entries()) {
    if (/content\.hpf$/i.test(name)) {
      try {
        const hpfXml = textDecoder.decode(bytes);
        const hpfDoc = parser.parseFromString(hpfXml, 'text/xml');
        const dcTitle = hpfDoc.getElementsByTagName('dc:title')[0]?.textContent?.trim();
        if (dcTitle) metaTitle = dcTitle;
      } catch (_) {
        // ignore
      }
      break;
    }
  }

  // Find section0.xml or any section*.xml
  let sectionXmlString: string | null = null;

  for (const [name, bytes] of files.entries()) {
    if (/Contents\/section\d*\.xml/i.test(name) || /section0\.xml/i.test(name)) {
      sectionXmlString = textDecoder.decode(bytes);
      break;
    }
  }

  if (!sectionXmlString) {
    throw new Error('HWPX 파일 내부에서 문서 본문(section*.xml)을 찾을 수 없습니다.');
  }

  const xmlDoc = parser.parseFromString(sectionXmlString, 'text/xml');
  const parseErrors = xmlDoc.getElementsByTagName('parsererror');
  if (parseErrors && parseErrors.length > 0) {
    throw new Error('HWPX XML 구조를 파싱하는 중 오류가 발생했습니다.');
  }

  // Parse result initialization
  const result: DocumentData = {
    title: metaTitle || '',
    purpose: '',
    overview: {
      eventName: '',
      dateTime: '',
      location: '',
      target: '',
      awardeeCount: '',
      attendeeCount: '',
      host: '',
      extra: '',
    },
    details: '',
    ceremonyRows: [],
    futurePlans: '',
  };

  type SectionType = 'none' | 'purpose' | 'overview' | 'details' | 'ceremony' | 'future';
  let currentSection: SectionType = 'none';
  let recognizedSections = 0;

  const purposeLines: string[] = [];
  const overviewExtraLines: string[] = [];
  const detailsLines: string[] = [];
  const futureLines: string[] = [];

  // Helper to get pure text content of a paragraph (ignoring text in nested tables)
  const getParaDirectText = (pElem: Element): string => {
    let text = '';
    const tNodes = pElem.getElementsByTagName('hp:t').length > 0
      ? Array.from(pElem.getElementsByTagName('hp:t'))
      : Array.from(pElem.getElementsByTagName('t'));

    for (const t of tNodes) {
      let parent = t.parentElement;
      let inTbl = false;
      while (parent && parent !== pElem) {
        const tag = (parent.tagName || '').toLowerCase();
        if (tag.includes('tbl')) {
          inTbl = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!inTbl) {
        text += t.textContent || '';
      }
    }
    return text.trim();
  };

  // Process all paragraphs in order
  const pList = xmlDoc.getElementsByTagName('hp:p').length > 0
    ? Array.from(xmlDoc.getElementsByTagName('hp:p'))
    : Array.from(xmlDoc.getElementsByTagName('p'));

  for (const p of pList) {
    // Skip paragraphs that are inside a table cell/subList
    let parent = p.parentElement;
    let insideTable = false;
    while (parent && parent !== xmlDoc.documentElement) {
      const pTag = (parent.tagName || '').toLowerCase();
      if (pTag.includes('tbl') || pTag.includes('tc') || pTag.includes('sublist')) {
        insideTable = true;
        break;
      }
      parent = parent.parentElement;
    }
    if (insideTable) continue;

    // Check if this top-level paragraph contains a table
    const tblList = p.getElementsByTagName('hp:tbl').length > 0
      ? Array.from(p.getElementsByTagName('hp:tbl'))
      : Array.from(p.getElementsByTagName('tbl'));

    if (tblList.length > 0) {
      const tbl = tblList[0];
      const trList = tbl.getElementsByTagName('hp:tr').length > 0
        ? Array.from(tbl.getElementsByTagName('hp:tr'))
        : Array.from(tbl.getElementsByTagName('tr'));

      let timeColIdx = 0;
      let contentColIdx = 1;
      let remarksColIdx = 2;
      let startIndex = 0;

      // Analyze header row if present
      if (trList.length > 0) {
        const firstTr = trList[0];
        const headerTcs = firstTr.getElementsByTagName('hp:tc').length > 0
          ? Array.from(firstTr.getElementsByTagName('hp:tc'))
          : Array.from(firstTr.getElementsByTagName('tc'));

        const headerTexts = headerTcs.map(tc => {
          const tTags = tc.getElementsByTagName('hp:t').length > 0
            ? Array.from(tc.getElementsByTagName('hp:t'))
            : Array.from(tc.getElementsByTagName('t'));
          return tTags.map(t => t.textContent || '').join('').replace(/\s+/g, '');
        });

        const isHeaderRow = headerTexts.some(txt =>
          txt.includes('시간') || txt.includes('내용') || txt.includes('식순') || txt.includes('비고') || txt.includes('담당')
        );

        if (isHeaderRow) {
          startIndex = 1;
          headerTexts.forEach((txt, idx) => {
            if (txt.includes('시간') || txt.includes('일시')) timeColIdx = idx;
            else if (txt.includes('내용') || txt.includes('식순') || txt.includes('행사')) contentColIdx = idx;
            else if (txt.includes('비고') || txt.includes('담당')) remarksColIdx = idx;
          });
        }
      }

      for (let rIdx = startIndex; rIdx < trList.length; rIdx++) {
        const tr = trList[rIdx];
        const tcList = tr.getElementsByTagName('hp:tc').length > 0
          ? Array.from(tr.getElementsByTagName('hp:tc'))
          : Array.from(tr.getElementsByTagName('tc'));

        const cellTexts = tcList.map(tc => {
          const tTags = tc.getElementsByTagName('hp:t').length > 0
            ? Array.from(tc.getElementsByTagName('hp:t'))
            : Array.from(tc.getElementsByTagName('t'));
          return tTags.map(t => t.textContent || '').join('').trim();
        });

        const time = cellTexts[timeColIdx] || cellTexts[0] || '';
        const content = cellTexts[contentColIdx] || cellTexts[1] || '';
        const remarks = (remarksColIdx < cellTexts.length ? cellTexts[remarksColIdx] : cellTexts[2]) || '';

        if (time || content || remarks) {
          result.ceremonyRows.push({
            id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            time,
            content,
            remarks,
          });
        }
      }
    }

    const text = getParaDirectText(p);
    if (!text) continue;

    // 1. Detect Document Title if not set yet and no section header encountered
    if (!result.title && currentSection === 'none') {
      // If text doesn't look like section header, treat as title
      if (!/^(?:\d[\.\s]|\[\d\]|\(\d\))?\s*(?:목\s*적|개\s*요|세\s*부\s*내\s*용|시\s*상\s*식\s*순\s*서|식\s*순|진\s*행|향\s*후\s*계\s*획)/.test(text)) {
        result.title = text;
        continue;
      }
    }

    // 2. Check for Section Headers
    if (/^(?:1[\.\s]|\[1\]|\(1\))?\s*목\s*적/.test(text)) {
      currentSection = 'purpose';
      recognizedSections++;
      continue;
    }
    if (/^(?:2[\.\s]|\[2\]|\(2\))?\s*개\s*요/.test(text)) {
      currentSection = 'overview';
      recognizedSections++;
      continue;
    }
    if (/^(?:3[\.\s]|\[3\]|\(3\))?\s*세\s*부\s*내\s*용/.test(text)) {
      currentSection = 'details';
      recognizedSections++;
      continue;
    }
    if (/^(?:4[\.\s]|\[4\]|\(4\))?\s*(?:시\s*상\s*식\s*순\s*서|식\s*순|진\s*행\s*순\s*서|행\s*사\s*일\s*정)/.test(text)) {
      currentSection = 'ceremony';
      recognizedSections++;
      continue;
    }
    if (/^(?:5[\.\s]|\[5\]|\(5\))?\s*향\s*후\s*계\s*획/.test(text)) {
      currentSection = 'future';
      recognizedSections++;
      continue;
    }

    // 3. Process lines by current section
    if (currentSection === 'purpose') {
      const isSub = text.startsWith('-');
      const clean = text.replace(/^[○•\-\*\s]+/, '').trim();
      if (clean) purposeLines.push(isSub ? `- ${clean}` : clean);
    } else if (currentSection === 'overview') {
      // Test key-value match
      const kvMatch = text.match(/^(?:○|•|\*|-)?\s*(행사명|대회명|행사명칭|일시|일자|행사일시|개최일시|기간|장소|행사장소|개최장소|대상|참가대상|참석대상|시상대상|수상\s*인원|수상인원|시상인원|수상규모|참석\s*예정|참석예정|참석인원|예상인원|주최\s*[·\/\.\s]*주관|주최\s*및\s*주관|주최|주관)\s*[:：]\s*(.*)$/);
      if (kvMatch) {
        const key = kvMatch[1].replace(/[\s·\/\.]+/g, '');
        const val = (kvMatch[2] || '').trim();
        if (key.includes('행사명') || key.includes('대회명') || key.includes('행사명칭')) result.overview.eventName = val;
        else if (key.includes('일시') || key.includes('일자') || key.includes('기간')) result.overview.dateTime = val;
        else if (key.includes('장소')) result.overview.location = val;
        else if (key.includes('대상')) result.overview.target = val;
        else if (key.includes('수상인원') || key.includes('시상인원') || key.includes('수상규모')) result.overview.awardeeCount = val;
        else if (key.includes('참석예정') || key.includes('참석인원') || key.includes('예상인원')) result.overview.attendeeCount = val;
        else if (key.includes('주최') || key.includes('주관')) result.overview.host = val;
      } else {
        const isSub = text.startsWith('-');
        const clean = text.replace(/^[○•\-\*\s]+/, '').trim();
        if (clean) overviewExtraLines.push(isSub ? `- ${clean}` : clean);
      }
    } else if (currentSection === 'details') {
      const isSub = text.startsWith('-');
      const clean = text.replace(/^[○•\-\*\s]+/, '').trim();
      if (clean) detailsLines.push(isSub ? `- ${clean}` : clean);
    } else if (currentSection === 'ceremony') {
      // Fallback: If no table was found, try parsing "HH:MM ~ HH:MM 내용 (비고)" from paragraph
      const timeMatch = text.match(/^([0-2]?\d:[0-5]\d(?:\s*~\s*[0-2]?\d:[0-5]\d)?)\s+(.*?)(?:\s*\((.*?)\)|\s*[-–]\s*(.*?))?$/);
      if (timeMatch) {
        result.ceremonyRows.push({
          id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          time: timeMatch[1].trim(),
          content: timeMatch[2].trim(),
          remarks: (timeMatch[3] || timeMatch[4] || '').trim(),
        });
      }
    } else if (currentSection === 'future') {
      const isSub = text.startsWith('-');
      const clean = text.replace(/^[○•\-\*\s]+/, '').trim();
      if (clean) futureLines.push(isSub ? `- ${clean}` : clean);
    }
  }

  result.purpose = purposeLines.join('\n');
  result.overview.extra = overviewExtraLines.join('\n');
  result.details = detailsLines.join('\n');
  result.futurePlans = futureLines.join('\n');

  if (!result.title) {
    result.title = '우체국 문화전 수상자 시상식 계획';
  }

  return {
    data: result,
    recognizedSectionsCount: recognizedSections,
  };
}
