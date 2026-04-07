'use client';

import { useState, useEffect, useCallback } from 'react';
import { Request, RequestStatus, Store } from '@/types';
import { getRequests, getStores, updateRequestStatus, deleteRequest } from '@/lib/api';
import { exportCSV } from '@/lib/utils';
import { ToastProvider, useToast } from '@/components/Toast';
import RequestForm from '@/components/RequestForm';
import KanbanBoard from '@/components/KanbanBoard';
import ListView from '@/components/ListView';
import CalendarView from '@/components/CalendarView';
import RequestModal from '@/components/RequestModal';
import Manifest from '@/components/Manifest';
import Settings from '@/components/Settings';

type ViewType = 'kanban' | 'list' | 'cal';
type TabType = 'form' | 'kanban' | 'manifest' | 'settings';

function MainContent() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('form');
  const [viewType, setViewType] = useState<ViewType>('kanban');
  const [requests, setRequests] = useState<Request[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  // フィルター
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('created');

  // モーダル
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // マニフェスト
  const [manifestRequest, setManifestRequest] = useState<Request | null>(null);
  const [manifestType, setManifestType] = useState<'none' | 'asb'>('none');
  const [manifestSearch, setManifestSearch] = useState('');
  const [manifestStatusFilter, setManifestStatusFilter] = useState('all');
  const [manifestStoreFilter, setManifestStoreFilter] = useState('all');
  const [manifestSort, setManifestSort] = useState('created');

  const loadData = useCallback(async () => {
    try {
      const [requestsData, storesData] = await Promise.all([
        getRequests(),
        getStores(),
      ]);
      setRequests(requestsData);
      setStores(storesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // フィルタリング
  const getFilteredRequests = useCallback(() => {
    let filtered = [...requests];

    // 検索
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.store_name.toLowerCase().includes(q)
      );
    }

    // ステータス
    if (statusFilter === 'active') {
      filtered = filtered.filter((r) => parseInt(r.status) < 5);
    } else if (statusFilter === 'done') {
      filtered = filtered.filter((r) => r.status === '5');
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // 店舗
    if (storeFilter !== 'all') {
      filtered = filtered.filter((r) => r.store_id === storeFilter);
    }

    // ソート
    if (sortOrder === 'date_asc') {
      filtered.sort((a, b) => a.collection_date.localeCompare(b.collection_date));
    } else if (sortOrder === 'date_desc') {
      filtered.sort((a, b) => b.collection_date.localeCompare(a.collection_date));
    }

    return filtered;
  }, [requests, searchQuery, statusFilter, storeFilter, sortOrder]);

  // マニフェスト用フィルタリング
  const getManifestFilteredRequests = useCallback(() => {
    let filtered = [...requests];

    if (manifestSearch) {
      const q = manifestSearch.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.store_name.toLowerCase().includes(q)
      );
    }

    if (manifestStatusFilter === 'active') {
      filtered = filtered.filter((r) => parseInt(r.status) < 5);
    } else if (manifestStatusFilter === 'done') {
      filtered = filtered.filter((r) => r.status === '5');
    } else if (manifestStatusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === manifestStatusFilter);
    }

    if (manifestStoreFilter !== 'all') {
      filtered = filtered.filter((r) => r.store_id === manifestStoreFilter);
    }

    if (manifestSort === 'date_asc') {
      filtered.sort((a, b) => a.collection_date.localeCompare(b.collection_date));
    } else if (manifestSort === 'date_desc') {
      filtered.sort((a, b) => b.collection_date.localeCompare(a.collection_date));
    }

    return filtered;
  }, [requests, manifestSearch, manifestStatusFilter, manifestStoreFilter, manifestSort]);

  const handleStatusChange = async (id: string, status: RequestStatus) => {
    try {
      await updateRequestStatus(id, status);
      const request = requests.find((r) => r.id === id);
      showToast(
        `✓ [${request?.store_name}] → ${
          status === '0'
            ? '依頼受付'
            : status === '1'
            ? '配車手配中'
            : status === '2'
            ? '配車完了'
            : status === '3'
            ? '回収済み'
            : status === '4'
            ? '請求書発行'
            : '完了'
        }`
      );
      loadData();
    } catch (error) {
      showToast('ステータス更新に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRequest(id);
      showToast('削除しました');
      loadData();
    } catch (error) {
      showToast('削除に失敗しました');
    }
  };

  const handleCardClick = (request: Request) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const handlePrintManifest = (request: Request) => {
    setManifestRequest(request);
    setManifestType('none');
    setActiveTab('manifest');
  };

  const handleExportCSV = () => {
    const filtered = getFilteredRequests();
    if (filtered.length === 0) {
      showToast('対象データがありません');
      return;
    }

    const data = filtered.map((r) => ({
      依頼番号: r.request_code,
      受付日: r.created_at,
      ステータス:
        r.status === '0'
          ? '依頼受付'
          : r.status === '1'
          ? '配車手配中'
          : r.status === '2'
          ? '配車完了'
          : r.status === '3'
          ? '回収済み'
          : r.status === '4'
          ? '請求書発行'
          : '完了',
      店舗名: r.store_name,
      お客様名: r.customer_name,
      郵便番号: r.zip || '',
      住所: r.address,
      施工業者: r.builder || '',
      現場責任者: r.chief,
      現場責任者連絡先: r.chief_tel,
      店舗担当者: r.staff,
      店舗担当者連絡先: r.staff_tel,
      担当者メール: r.email,
      回収日: r.collection_date,
      開始時間: r.time_from,
      終了時間: r.time_to,
      車両サイズ: r.car_size || '未指定',
      補助人工: r.helper === 'yes' ? '要' : '無',
      'キッチン㎡': r.vol_kitchen,
      'バス㎡': r.vol_bath,
      'トイレ㎡': r.vol_toilet,
      'その他㎡': r.vol_other,
      アスベスト: r.has_asbestos ? '有' : '無',
      '石綿量㎡': r.vol_asbestos,
      収集運搬業者: r.routing_none?.carrier?.name || '',
      処分業者: r.routing_none?.processor?.name || '',
      運搬先事業所: r.routing_none?.dest?.name || '',
      備考: r.note || '',
    }));

    const filename = `arkhome_回収実績_${new Date().toISOString().slice(0, 10)}.csv`;
    exportCSV(data, filename);
    showToast(`📥 ${filtered.length}件をCSV出力しました`);
  };

  const activeRequestCount = requests.filter((r) => parseInt(r.status) < 5).length;

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--tx3)' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <>
      {/* ナビゲーション */}
      <nav>
        <div className="brand">
          共栄紙業 / <b>Arc Home</b>
        </div>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'form' ? 'on' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            📋 回収依頼
          </button>
          <button
            className={`tab ${activeTab === 'kanban' ? 'on' : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            🗂 管理ボード
            <span className="pill">{activeRequestCount}</span>
          </button>
          <button
            className={`tab ${activeTab === 'manifest' ? 'on' : ''}`}
            onClick={() => setActiveTab('manifest')}
          >
            📄 マニフェスト
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'on' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙ マスター設定
          </button>
        </div>
      </nav>

      {/* フォームタブ */}
      <div className={`page ${activeTab === 'form' ? 'on' : ''}`}>
        <RequestForm onSubmitSuccess={() => loadData()} />
      </div>

      {/* 管理ボードタブ */}
      <div className={`page wide ${activeTab === 'kanban' ? 'on' : ''}`}>
        <div className="kb-toolbar">
          <div>
            <div className="ph">管理ボード</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="search-inp"
              placeholder="🔍 お客様名・住所で検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="filter-sel"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">全ステータス</option>
              <option value="active">依頼中（完了以外）</option>
              <option value="done">完了済み</option>
              <option value="0">依頼受付</option>
              <option value="1">配車手配中</option>
              <option value="2">配車完了</option>
              <option value="3">回収済み</option>
              <option value="4">請求書発行</option>
              <option value="5">完了</option>
            </select>
            <select
              className="filter-sel"
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
            >
              <option value="all">全店舗</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <select
              className="sort-sel"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="created">受付順</option>
              <option value="date_asc">回収日 昇順</option>
              <option value="date_desc">回収日 降順</option>
            </select>
            <button
              className={`view-btn ${viewType === 'kanban' ? 'on' : ''}`}
              onClick={() => setViewType('kanban')}
            >
              🗂 カンバン
            </button>
            <button
              className={`view-btn ${viewType === 'list' ? 'on' : ''}`}
              onClick={() => setViewType('list')}
            >
              📋 リスト
            </button>
            <button
              className={`view-btn ${viewType === 'cal' ? 'on' : ''}`}
              onClick={() => setViewType('cal')}
            >
              📅 カレンダー
            </button>
            <button
              className="view-btn"
              onClick={handleExportCSV}
              style={{ borderColor: 'var(--g)', color: 'var(--g)' }}
            >
              📥 CSV
            </button>
          </div>
        </div>

        {viewType === 'kanban' && (
          <KanbanBoard
            requests={getFilteredRequests()}
            onCardClick={handleCardClick}
            onStatusChange={handleStatusChange}
            onPrintManifest={handlePrintManifest}
          />
        )}
        {viewType === 'list' && (
          <ListView
            requests={getFilteredRequests()}
            onCardClick={handleCardClick}
            onStatusChange={handleStatusChange}
            onPrintManifest={handlePrintManifest}
          />
        )}
        {viewType === 'cal' && (
          <CalendarView
            requests={getFilteredRequests()}
            onCardClick={handleCardClick}
          />
        )}
      </div>

      {/* マニフェストタブ */}
      <div className={`page wide ${activeTab === 'manifest' ? 'on' : ''}`}>
        <div className="ph">現場回収依頼書（兼電子マニフェスト受渡確認票）</div>
        <div className="manifest-area">
          <div
            className="mf-sel"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}
          >
            <input
              type="text"
              className="search-inp"
              placeholder="🔍 お客様名・住所・店舗名で検索"
              value={manifestSearch}
              onChange={(e) => setManifestSearch(e.target.value)}
              style={{ minWidth: '220px' }}
            />
            <select
              className="filter-sel"
              value={manifestStatusFilter}
              onChange={(e) => setManifestStatusFilter(e.target.value)}
            >
              <option value="all">全ステータス</option>
              <option value="active">依頼中（完了以外）</option>
              <option value="done">完了済み</option>
              <option value="0">依頼受付</option>
              <option value="1">配車手配中</option>
              <option value="2">配車完了</option>
              <option value="3">回収済み</option>
              <option value="4">請求書発行</option>
              <option value="5">完了</option>
            </select>
            <select
              className="filter-sel"
              value={manifestStoreFilter}
              onChange={(e) => setManifestStoreFilter(e.target.value)}
            >
              <option value="all">全店舗</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <select
              className="sort-sel"
              value={manifestSort}
              onChange={(e) => setManifestSort(e.target.value)}
            >
              <option value="created">受付順</option>
              <option value="date_asc">回収日 昇順</option>
              <option value="date_desc">回収日 降順</option>
            </select>
            <select
              value={manifestRequest?.id || ''}
              onChange={(e) => {
                const req = requests.find((r) => r.id === e.target.value);
                setManifestRequest(req || null);
                setManifestType('none');
              }}
              style={{
                minWidth: '280px',
                padding: '6px 12px',
                border: '1.5px solid var(--bdr)',
                borderRadius: '7px',
                fontFamily: 'inherit',
                fontSize: '13px',
                background: 'var(--sur)',
                color: 'var(--tx)',
                outline: 'none',
              }}
            >
              <option value="">— 依頼を選択 —</option>
              {getManifestFilteredRequests().map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.collection_date}] {r.store_name} {r.customer_name} — {r.request_code}
                </option>
              ))}
            </select>
            <button className="prt-btn" onClick={() => window.print()}>
              🖨 印刷 / PDF保存
            </button>
          </div>

          {manifestRequest && (
            <div className="mf-tabs">
              <button
                className={`mf-tab ${manifestType === 'none' ? 'on' : ''}`}
                onClick={() => setManifestType('none')}
              >
                📄 石綿なし
              </button>
              {manifestRequest.has_asbestos && (
                <button
                  className={`mf-tab ${manifestType === 'asb' ? 'on' : ''}`}
                  onClick={() => setManifestType('asb')}
                >
                  📄 石綿あり
                </button>
              )}
            </div>
          )}

          <div id="mf-area">
            {manifestRequest ? (
              <Manifest request={manifestRequest} type={manifestType} />
            ) : (
              <div className="empty-mf">
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>📄</div>
                <p>依頼を選ぶとマニフェストが表示されます</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 設定タブ */}
      {activeTab === 'settings' && <Settings />}

      {/* モーダル */}
      <RequestModal
        request={selectedRequest}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onPrintManifest={handlePrintManifest}
        onUpdated={loadData}
      />
    </>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <MainContent />
    </ToastProvider>
  );
}
