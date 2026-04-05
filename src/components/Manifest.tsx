'use client';

import { Request, DISCHARGER, RUSEAL_FAX, KYOEI_FAX, KYOEI, RoutingInfo } from '@/types';
import { formatDate } from '@/lib/utils';

interface ManifestProps {
  request: Request;
  type: 'none' | 'asb';
}

export default function Manifest({ request, type }: ManifestProps) {
  const isAsb = type === 'asb';
  const rt: RoutingInfo | null = isAsb ? request.routing_asb : request.routing_none;

  if (!rt) {
    return (
      <div style={{ padding: '24px', color: 'red' }}>
        業者設定がありません（マスター設定で紐付けを確認）
      </div>
    );
  }

  const carrier = rt.carrier || { name: '', tel: '', no: '', pw: '', zip: '', addr: '', fax: '', contact: '' };
  const processor = rt.processor || { name: '', tel: '', no: '', pw: '', zip: '', addr: '', fax: '', contact: '' };
  const dest = rt.dest || { name: '', tel: '', no: '', pw: '', zip: '', addr: '', fax: '', contact: '' };
  const transfer = rt.transfer;
  const carrier2 = rt.carrier2 || null;
  const finalDest = rt.final_dest || null;
  const faxNo = rt.fax || KYOEI_FAX;

  const d = formatDate(request.collection_date);

  // 排出量計算
  const totalVol = (request.vol_kitchen || 0) + (request.vol_bath || 0) + 
                   (request.vol_toilet || 0) + (request.vol_other || 0);

  const volDisplay = isAsb 
    ? (request.vol_asbestos || 0).toFixed(1) + '㎥'
    : totalVol > 0 ? totalVol.toFixed(1) + '㎥' : '';

  const CAR_SIZES = ['軽トラ', '2t車', '4t車', 'ユニック'];
  const HELPERS = ['無', '要'];

  return (
    <div className={`manifest ${isAsb ? 'manifest-asb' : 'manifest-none'}`}>
      {/* タイトル行 */}
      <div className="mf-title-row">
        <div className="title">
          アークホーム㈱　現場回収依頼書（兼電子マニフェスト受渡確認票）
          {isAsb && '　【石綿含有】'}
        </div>
        <div className="mf-date-box">
          日付　
          <span className="date-val">
            {d.y || '　　　　'}年　{d.m || '　　'}月　{d.d || '　　'}日
          </span>
        </div>
      </div>

      {/* 上部フォーム */}
      <table className="mf" style={{ tableLayout: 'fixed', width: '100%' }}>
        <colgroup>
          <col style={{ width: '9%' }} />
          <col style={{ width: '37%' }} />
          <col style={{ width: '4%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="lbl">回収希望日</td>
            <td className="val" colSpan={2}>
              <b>西暦　{d.y}年　{d.m}月　{d.d}日</b>
            </td>
            <td className="lbl">収集運搬業者</td>
            <td className="val" colSpan={3}>
              <b>{carrier.name || '　'}</b>
            </td>
          </tr>
          <tr>
            <td className="lbl">回収希望時間帯</td>
            <td className="val" colSpan={2}>
              <b>{request.time_from}　〜　{request.time_to}</b>
            </td>
            <td className="lbl">収集運搬業者連絡先</td>
            <td className="val" colSpan={3}>TEL：{carrier.tel || '　'}</td>
          </tr>
          <tr>
            <td className="lbl">依頼場所の名称</td>
            <td className="val" colSpan={2}>
              <b className="blue">{request.customer_name}</b>
            </td>
            <td className="lbl">店舗名</td>
            <td className="lbl">店舗担当者名</td>
            <td className="lbl" colSpan={2}>店舗担当者（連絡先）</td>
          </tr>
          <tr>
            <td className="lbl">依頼場所の住所</td>
            <td className="val" colSpan={2}>
              <b className="blue">
                {request.zip ? `〒${request.zip}　` : ''}{request.address}
              </b>
            </td>
            <td className="val"><b>{request.store_name}</b></td>
            <td className="val"><b className="blue">{request.staff}</b></td>
            <td className="val" colSpan={2}><b className="blue">{request.staff_tel}</b></td>
          </tr>
          <tr>
            <td className="lbl" rowSpan={2} style={{ verticalAlign: 'middle' }}>排出予定量</td>
            <td className="val" colSpan={2} rowSpan={2} style={{ verticalAlign: 'middle' }}>
              {[
                ['キッチン', request.vol_kitchen],
                ['バス', request.vol_bath],
                ['トイレ', request.vol_toilet],
                ['その他', request.vol_other],
              ].map(([label, vol]) => (
                <span
                  key={label as string}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '1px',
                    marginRight: '10px',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: '1.5px solid #333',
                      textAlign: 'center',
                      lineHeight: '10px',
                      fontSize: '10px',
                    }}
                  >
                    {vol ? '✓' : ''}
                  </span>
                  {label}{vol ? ` ${vol}㎡` : ''}
                </span>
              ))}
              {isAsb && `　石綿含有 ${request.vol_asbestos || ''}㎡`}
            </td>
            <td className="lbl">施工業者名</td>
            <td className="lbl">現場責任者名（担当者名）</td>
            <td className="lbl" colSpan={2}>現場責任者（連絡先）</td>
          </tr>
          <tr>
            <td className="val"><b>{request.builder || '　'}</b></td>
            <td className="val"><b className="blue">{request.chief}</b></td>
            <td className="val" colSpan={2}><b className="blue">{request.chief_tel}</b></td>
          </tr>
          <tr>
            <td className="lbl">回収車両サイズ</td>
            <td className="val" colSpan={2}>
              {CAR_SIZES.map((s) => (
                <span
                  key={s}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '1px',
                    marginRight: '8px',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: '1.5px solid #333',
                      textAlign: 'center',
                      lineHeight: '10px',
                      fontSize: '10px',
                    }}
                  >
                    {request.car_size === s ? '✓' : ''}
                  </span>
                  {s}
                </span>
              ))}
            </td>
            <td className="lbl">補助人工の依頼</td>
            <td className="val" colSpan={3}>
              {HELPERS.map((s) => (
                <span
                  key={s}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '1px',
                    marginRight: '8px',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: '1.5px solid #333',
                      textAlign: 'center',
                      lineHeight: '10px',
                      fontSize: '10px',
                    }}
                  >
                    {(s === '無' && request.helper === 'none') || (s === '要' && request.helper === 'yes')
                      ? '✓'
                      : ''}
                  </span>
                  {s}
                </span>
              ))}
              　（　　　）人
            </td>
          </tr>
          {request.note && (
            <tr>
              <td className="lbl">備考</td>
              <td className="val" colSpan={6}>{request.note}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* マニフェスト本体 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', border: '1px solid #999', borderTop: 'none' }}>
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            background: '#4a7fc1',
            color: '#fff',
            fontSize: '9px',
            fontWeight: 700,
            padding: '4px 2px',
            textAlign: 'center',
            borderRight: '1px solid #999',
          }}
        >
          マニフェスト
        </div>
        <div>
          {/* 排出者ブロック */}
          <table className="mf" style={{ borderLeft: 'none', tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '6%' }} />
              <col style={{ width: '44%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '38%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="lbl">排出者</td>
                <td className="val" style={{ fontWeight: 700, fontSize: '11px' }}>{DISCHARGER}</td>
                <td
                  style={{
                    border: '1px solid #999',
                    padding: '2px 4px',
                    fontSize: '8px',
                    background: '#e8e8e8',
                    writingMode: 'vertical-rl',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                  rowSpan={2}
                >
                  事業場（排出事業場）
                </td>
                <td className="lbl" style={{ fontSize: '8.5px' }}>氏名又は名称</td>
                <td className="val" style={{ fontWeight: 700, color: '#1a5c9a' }}>{request.customer_name}</td>
              </tr>
              <tr>
                <td className="lbl">店舗</td>
                <td className="val" style={{ fontWeight: 700, fontSize: '13px' }}>{request.store_name}</td>
                <td className="lbl">所在地</td>
                <td className="val" style={{ color: '#1a5c9a' }}>
                  {request.zip ? `〒${request.zip}　` : ''}{request.address}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 品目 */}
          <table className="mf" style={{ borderLeft: 'none', borderTop: 'none', tableLayout: 'fixed', width: '100%' }}>
            <tbody>
              <tr style={{ height: '70px' }}>
                <td
                  style={{
                    background: '#d6e4f7',
                    fontSize: '8.5px',
                    padding: '2px 4px',
                    fontWeight: 700,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    width: '14px',
                  }}
                >
                  1
                </td>
                <td className="val" style={{ padding: '4px 6px', verticalAlign: 'top', width: '36%' }}>
                  <div style={{ fontSize: '8px', color: '#555', marginBottom: '3px' }}>
                    種類（該当に☑　無い物は空欄に記載）
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      fontSize: '8.5px',
                      lineHeight: 1.8,
                      gap: '0 4px',
                    }}
                  >
                    <span>○廃プラスチック類</span>
                    <span>○木くず</span>
                    <span>○金属くず</span>
                    <span>○ガラス陶磁器くず</span>
                    <span>○繊維くず</span>
                    <span>○がれき類</span>
                    <span>○汚泥</span>
                    <span>○廃石膏ボード</span>
                    <span>○安定型混合廃棄物</span>
                    <span>○管理型混合廃棄物</span>
                  </div>
                </td>
                <td className="lbl" style={{ textAlign: 'center', verticalAlign: 'middle', width: '5%' }}>
                  名称
                </td>
                <td
                  className="val"
                  style={{ fontWeight: 700, fontSize: '11px', color: '#1a3060', padding: '2px 4px', verticalAlign: 'middle', width: '11%' }}
                >
                  {isAsb ? 'がれき類' : '管理型混合廃棄物'}
                </td>
                <td className="lbl" style={{ textAlign: 'center', verticalAlign: 'middle', width: '4%' }}>
                  数量
                </td>
                <td className="val" style={{ padding: '2px 8px', verticalAlign: 'middle', width: '7%' }}>
                  {volDisplay}
                </td>
                <td className="lbl" style={{ textAlign: 'center', verticalAlign: 'middle', width: '8%' }}>
                  <div>形状・荷姿</div>
                  <div style={{ fontSize: '7px', fontWeight: 400, color: '#555', marginTop: '2px', whiteSpace: 'nowrap' }}>
                    あてはまる<br />ものに○
                  </div>
                </td>
                <td className="val" style={{ padding: '4px 6px', verticalAlign: 'middle', width: '12%' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      fontSize: '8.5px',
                      gap: '3px 6px',
                      textAlign: 'center',
                    }}
                  >
                    <span>固形</span>
                    <span>バラ</span>
                    <span>袋</span>
                    <span style={{ color: '#888' }}>泥状</span>
                    <span style={{ color: '#888' }}>フレコン</span>
                    <span style={{ color: '#888' }}>コンテナ</span>
                    <span style={{ color: '#888' }}>液状</span>
                    <span style={{ color: '#888' }}>ドラム</span>
                    <span style={{ color: '#888' }}>その他</span>
                  </div>
                </td>
                <td className="lbl" style={{ textAlign: 'center', verticalAlign: 'middle', width: '4%' }}>
                  備考
                </td>
                <td
                  className="val"
                  style={{ verticalAlign: 'bottom', textAlign: 'right', padding: '4px 6px', fontSize: '10px', fontWeight: 700 }}
                >
                  ㎏
                </td>
              </tr>
            </tbody>
          </table>

          {/* 運搬受託者・処分受託者 */}
          <table className="mf vendor-tbl" style={{ borderLeft: 'none', borderTop: 'none', width: '100%' }}>
            <tbody>
              {/* 運搬受託者 行1 | 運搬先 行1 */}
              <tr>
                <td
                  className="lbl"
                  style={{
                    writingMode: 'vertical-rl',
                    fontSize: '10px',
                    textAlign: 'center',
                    width: '26px',
                    minWidth: '26px',
                    padding: '4px 2px',
                  }}
                  rowSpan={2}
                >
                  運搬受託者
                </td>
                <td className="lbl" style={{ width: '7%' }}>氏名又は名称</td>
                <td className="val" style={{ fontWeight: 700, width: '16%' }}>{carrier.name || '　'}</td>
                <td className="lbl" style={{ textAlign: 'center', fontSize: '9px', width: '6%' }}>加入者番号</td>
                <td className="val" style={{ width: '6%' }}>{carrier.no || '　'}</td>
                <td className="lbl" style={{ textAlign: 'center', fontSize: '9px', width: '6%' }}>公開パスワード</td>
                <td className="val" style={{ width: '6%' }}>{carrier.pw || '　'}</td>
                <td
                  className="lbl"
                  style={{
                    writingMode: 'vertical-rl',
                    fontSize: '10px',
                    textAlign: 'center',
                    width: '26px',
                    minWidth: '26px',
                    padding: '4px 2px',
                  }}
                  rowSpan={2}
                >
                  処分事業場
                </td>
                <td className="lbl" style={{ width: '7%' }}>氏名又は名称</td>
                <td className="val" style={{ fontWeight: 700, width: '16%' }}>{dest.name || processor.name || '　'}</td>
                <td className="lbl" style={{ textAlign: 'center', fontSize: '9px', width: '6%' }}>加入者番号</td>
                <td className="val" style={{ width: '6%' }}>{dest.no || processor.no || '　'}</td>
                <td className="lbl" style={{ textAlign: 'center', fontSize: '9px', width: '6%' }}>公開パスワード</td>
                <td className="val" style={{ width: '6%' }}>{dest.pw || processor.pw || '　'}</td>
              </tr>
              {/* 運搬受託者 行2(住所) | 運搬先 行2(住所) */}
              <tr>
                <td className="lbl" style={{ verticalAlign: 'middle' }}>住所</td>
                <td
                  className="val"
                  colSpan={5}
                  style={{ lineHeight: 1.6, padding: '5px 6px', fontSize: '10px', verticalAlign: 'middle' }}
                >
                  〒{carrier.zip || ''}　TEL {carrier.tel || ''}
                  <br />
                  {carrier.addr || ''}
                </td>
                <td className="lbl" style={{ verticalAlign: 'middle' }}>住所</td>
                <td
                  className="val"
                  colSpan={5}
                  style={{ lineHeight: 1.6, padding: '5px 6px', fontSize: '10px', verticalAlign: 'middle' }}
                >
                  〒{dest.zip || processor.zip || ''}　TEL {dest.tel || processor.tel || ''}
                  <br />
                  {dest.addr || processor.addr || ''}
                </td>
              </tr>
              {/* 処分受託者 行1 | 積替え 行1 */}
              <tr>
                <td
                  className="lbl"
                  style={{
                    writingMode: 'vertical-rl',
                    fontSize: '10px',
                    textAlign: 'center',
                    width: '26px',
                    minWidth: '26px',
                    padding: '4px 2px',
                  }}
                  rowSpan={2}
                >
                  処分受託者
                </td>
                <td className="lbl">氏名又は名称</td>
                <td className="val" style={{ fontWeight: 700 }} colSpan={5}>
                  {processor.name || '　'}
                </td>
                <td
                  className="lbl"
                  style={{
                    writingMode: 'vertical-rl',
                    fontSize: '10px',
                    textAlign: 'center',
                    width: '26px',
                    minWidth: '26px',
                    padding: '4px 2px',
                  }}
                  rowSpan={2}
                >
                  積替え又は保管
                </td>
                <td className="lbl">氏名又は名称</td>
                <td className="val" style={{ fontWeight: 700 }} colSpan={5}>
                  {transfer ? transfer.name : '＊＊＊＊＊＊＊＊＊＊＊＊'}
                </td>
              </tr>
              {/* 処分受託者 行2(住所) | 積替え 行2(所在地) */}
              <tr>
                <td className="lbl" style={{ verticalAlign: 'middle' }}>住所</td>
                <td
                  className="val"
                  colSpan={5}
                  style={{ lineHeight: 1.6, padding: '5px 6px', fontSize: '10px', verticalAlign: 'middle' }}
                >
                  〒{processor.zip || ''}　TEL {processor.tel || ''}
                  <br />
                  {processor.addr || ''}
                </td>
                <td className="lbl" style={{ verticalAlign: 'middle' }}>所在地</td>
                <td
                  className="val"
                  colSpan={5}
                  style={{ lineHeight: 1.6, padding: '5px 6px', fontSize: '10px', verticalAlign: 'middle' }}
                >
                  {transfer
                    ? (
                      <>
                        〒{transfer.zip || ''}　TEL {transfer.tel || ''}
                        <br />{transfer.addr || ''}
                      </>
                    )
                    : '＊＊＊＊＊＊＊＊＊＊＊'}
                </td>
              </tr>
              {/* 最終処分先・収集運搬区間2（carrier2 or finalDest がある場合のみ表示） */}
              {(carrier2 || finalDest) && (
                <>
                  {/* 最終処分先 行1 | 収集運搬区間2 行1 */}
                  <tr>
                    <td
                      className="lbl"
                      style={{
                        writingMode: 'vertical-rl',
                        fontSize: '10px',
                        textAlign: 'center',
                        width: '26px',
                        minWidth: '26px',
                        padding: '4px 2px',
                      }}
                      rowSpan={2}
                    >
                      最終処分先
                    </td>
                    <td className="lbl">氏名又は名称</td>
                    <td className="val" style={{ fontWeight: 700 }} colSpan={5}>
                      {finalDest ? finalDest.name : '　'}
                    </td>
                    <td
                      className="lbl"
                      style={{
                        writingMode: 'vertical-rl',
                        fontSize: '9px',
                        textAlign: 'center',
                        width: '26px',
                        minWidth: '26px',
                        padding: '4px 2px',
                        lineHeight: 1.2,
                      }}
                      rowSpan={2}
                    >
                      収集運搬区間2
                    </td>
                    <td className="lbl">氏名又は名称</td>
                    <td className="val" style={{ fontWeight: 700 }} colSpan={5}>
                      {carrier2 ? carrier2.name : '　'}
                    </td>
                  </tr>
                  {/* 最終処分先 行2(処分場所) | 収集運搬区間2 行2(所在地) */}
                  <tr>
                    <td className="lbl" style={{ verticalAlign: 'middle' }}>処分場所</td>
                    <td
                      className="val"
                      colSpan={5}
                      style={{ lineHeight: 1.6, padding: '5px 6px', fontSize: '10px', verticalAlign: 'middle' }}
                    >
                      {finalDest ? (
                        <>
                          〒{finalDest.zip || ''}　<span style={{ fontSize: '9px' }}>電話</span> {finalDest.tel || ''}
                          <br />{finalDest.addr || ''}
                        </>
                      ) : '　'}
                    </td>
                    <td className="lbl" style={{ verticalAlign: 'middle' }}>所在地</td>
                    <td
                      className="val"
                      colSpan={5}
                      style={{ lineHeight: 1.6, padding: '5px 6px', fontSize: '10px', verticalAlign: 'middle' }}
                    >
                      {carrier2 ? (
                        <>
                          〒{carrier2.zip || ''}　TEL {carrier2.tel || ''}
                          <br />{carrier2.addr || ''}
                        </>
                      ) : '　'}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* サイン欄 */}
      <div className="sign-row">
        <div className="sign-cell">
          <div className="sign-lbl">運転手（サイン）</div>
        </div>
        <div className="sign-cell">
          <div className="sign-lbl">店舗（サイン）</div>
        </div>
      </div>

      {/* FAXフッター */}
      <div className="fax-footer">
        <div className="fax-cell">
          <span>運搬完了後　FAX</span>
          <span>㈱ルシール</span>
          <span>FAX: {RUSEAL_FAX}</span>
        </div>
        <div className="fax-cell">
          <span>{KYOEI}</span>
          <span>FAX: {faxNo}</span>
        </div>
      </div>
    </div>
  );
}
