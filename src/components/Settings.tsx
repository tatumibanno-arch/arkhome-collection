{/* 紐付け編集モーダル */}
<div className={`vnd-ov ${mappingModalOpen ? 'on' : ''}`}>
  <div className="vnd-modal" style={{ maxWidth: '560px' }}>
    <div className="vnd-mh">
      <h3>🔗 {mappingStore?.name}　紐付け設定</h3>
      <button
        style={{
          background: 'rgba(255,255,255,.15)',
          border: 'none',
          color: '#fff',
          width: '30px',
          height: '30px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
        onClick={() => setMappingModalOpen(false)}
      >
        ✕
      </button>
    </div>
    <div style={{ padding: '20px' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--tx3)',
          marginBottom: '8px',
          borderBottom: '1px solid var(--bdr)',
          paddingBottom: '4px',
        }}
      >
        石綿なし
      </div>
      {(['carrier', 'processor', 'dest', 'carrier2', 'final_dest'] as const).map((field) => (
        <div
          key={`none-${field}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '110px auto 1fr',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>
            {CATEGORY_NAMES[field]}
          </span>
          <span style={{ color: 'var(--tx3)' }}>→</span>
          <select
            className="map-sel"
            value={mappingData.none[field]}
            onChange={(e) =>
              handleMappingChange('none', field, e.target.value)
            }
          >
            <option value="">選択</option>
            {getVendorsByCategory(field).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--rd)',
          margin: '14px 0 8px',
          borderBottom: '1px solid var(--rdl)',
          paddingBottom: '4px',
        }}
      >
        石綿あり
      </div>
      {(['carrier', 'processor', 'dest', 'transfer', 'carrier2', 'final_dest'] as const).map(
        (field) => (
          <div
            key={`asb-${field}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '110px auto 1fr',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>
              {CATEGORY_NAMES[field]}
            </span>
            <span style={{ color: 'var(--tx3)' }}>→</span>
            <select
              className="map-sel"
              value={mappingData.asb[field]}
              onChange={(e) =>
                handleMappingChange('asb', field, e.target.value)
              }
            >
              <option value="">選択</option>
              {getVendorsByCategory(field).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        )
      )}
    </div>
    <div className="vnd-mf">
      <button
        className="vnd-cancel"
        onClick={() => setMappingModalOpen(false)}
      >
        閉じる
      </button>
    </div>
  </div>
</div>
