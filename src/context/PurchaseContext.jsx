import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const PurchaseContext = createContext(null);

export function PurchaseProvider({ children }) {
  const [purchaseSettings, setPurchaseSettings] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // ─── 설정 ─────────────────────────────────────────────────────────────────

  const loadPurchaseSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('purchase_settings_2025_11_27_07_17')
      .select('*')
      .order('fiscal_year', { ascending: false })
      .order('department_name');
    if (!error) setPurchaseSettings(data || []);
    return { data, error };
  }, []);

  const savePurchaseSetting = async (setting) => {
    const payload = {
      fiscal_year: setting.fiscal_year,
      department_name: setting.department_name,
      allocated_amount: setting.allocated_amount,
      application_start_at: setting.application_start_at || null,
      application_end_at: setting.application_end_at || null,
      is_active: setting.is_active ?? true,
      updated_at: new Date().toISOString()
    };
    const { data, error } = setting.id
      ? await supabase.from('purchase_settings_2025_11_27_07_17').update(payload).eq('id', setting.id).select().single()
      : await supabase.from('purchase_settings_2025_11_27_07_17').insert(payload).select().single();
    if (!error) await loadPurchaseSettings();
    return { data, error };
  };

  const deletePurchaseSetting = async (id) => {
    const { error } = await supabase.from('purchase_settings_2025_11_27_07_17').delete().eq('id', id);
    if (!error) await loadPurchaseSettings();
    return { error };
  };

  // ─── 예산 현황 계산 ────────────────────────────────────────────────────────

  const getBudgetStatus = async (fiscalYear, departmentName) => {
    const setting = purchaseSettings.find(
      s => s.fiscal_year === fiscalYear && s.department_name === departmentName
    );
    const allocated = setting?.allocated_amount || 0;

    // 집행신청액: approved 이후 ~ closed 이전 신청의 approved_amount 합계
    const { data: reserved } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .select('approved_amount')
      .eq('fiscal_year', fiscalYear)
      .eq('department_name', departmentName)
      .in('status', ['approved', 'purchasing', 'awaiting_receipt', 'receipt_review']);

    const reservedTotal = (reserved || []).reduce((sum, r) => sum + (r.approved_amount || 0), 0);

    // 집행액: closed 상태의 purchased_amount 합계
    const { data: closed } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .select('purchased_amount')
      .eq('fiscal_year', fiscalYear)
      .eq('department_name', departmentName)
      .eq('status', 'closed');

    const purchasedTotal = (closed || []).reduce((sum, r) => sum + (r.purchased_amount || 0), 0);

    return {
      allocated,
      reserved: reservedTotal,
      purchased: purchasedTotal,
      available: allocated - reservedTotal - purchasedTotal
    };
  };

  // ─── 신청서 ────────────────────────────────────────────────────────────────

  const generateRequestNo = async (fiscalYear) => {
    const { count } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .select('*', { count: 'exact', head: true })
      .eq('fiscal_year', fiscalYear);
    const seq = String((count || 0) + 1).padStart(4, '0');
    return `PUR-${fiscalYear}-${seq}`;
  };

  const loadMyRequests = useCallback(async (applicantId) => {
    const { data, error } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .select(`
        *,
        items:purchase_request_items_2025_11_27_07_17(*),
        orders:purchase_orders_2025_11_27_07_17(*),
        attachments:purchase_attachments_2025_11_27_07_17(*)
      `)
      .eq('applicant_id', applicantId)
      .order('created_at', { ascending: false });
    if (!error) setPurchaseRequests(data || []);
    return { data, error };
  }, []);

  const loadAllRequests = useCallback(async (filters = {}) => {
    let query = supabase
      .from('purchase_requests_2025_11_27_07_17')
      .select(`
        *,
        applicant:users_2025_11_27_07_17(id, name, email, faculty, lab_name),
        items:purchase_request_items_2025_11_27_07_17(*),
        orders:purchase_orders_2025_11_27_07_17(*),
        attachments:purchase_attachments_2025_11_27_07_17(*)
      `)
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.fiscal_year) query = query.eq('fiscal_year', filters.fiscal_year);
    if (filters.department_name) query = query.eq('department_name', filters.department_name);

    const { data, error } = await query;
    if (!error) setPurchaseRequests(data || []);
    return { data, error };
  }, []);

  const getRequestDetail = async (id) => {
    const { data, error } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .select(`
        *,
        applicant:users_2025_11_27_07_17(id, name, email, phone, faculty, lab_name, position),
        items:purchase_request_items_2025_11_27_07_17(*),
        orders:purchase_orders_2025_11_27_07_17(*),
        receipts:purchase_receipts_2025_11_27_07_17(*),
        attachments:purchase_attachments_2025_11_27_07_17(*),
        history:purchase_history_2025_11_27_07_17(* )
      `)
      .eq('id', id)
      .single();
    return { data, error };
  };

  const saveDraft = async (formData, applicantId) => {
    try {
      const fiscalYear = new Date().getFullYear().toString();
      const requestNo = await generateRequestNo(fiscalYear);
      const totalAmount = (formData.items || []).reduce((s, i) => s + (i.total_price || 0), 0);

      const { data: req, error: reqErr } = await supabase
        .from('purchase_requests_2025_11_27_07_17')
        .insert({
          request_no: requestNo,
          fiscal_year: fiscalYear,
          applicant_id: applicantId,
          department_name: formData.department_name,
          lab_name: formData.lab_name,
          professor_name: formData.professor_name,
          title: formData.title,
          purpose: formData.purpose,
          delivery_name: formData.delivery_name,
          delivery_phone: formData.delivery_phone,
          delivery_address: formData.delivery_address,
          total_amount: totalAmount,
          status: 'draft'
        })
        .select()
        .single();

      if (reqErr) return { error: reqErr };

      if (formData.items?.length > 0) {
        const items = formData.items.map((item, i) => ({
          request_id: req.id,
          item_name: item.item_name,
          specification: item.specification || null,
          quantity: item.quantity,
          unit: item.unit || '개',
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          supplier_url: item.supplier_url || null,
          sort_order: i
        }));
        await supabase.from('purchase_request_items_2025_11_27_07_17').insert(items);
      }

      await addHistory(req.id, applicantId, formData.professor_name, '임시저장', null, 'draft');
      return { data: req };
    } catch (err) {
      return { error: err };
    }
  };

  const updateDraft = async (requestId, formData, applicantId) => {
    try {
      const totalAmount = (formData.items || []).reduce((s, i) => s + (i.total_price || 0), 0);

      const { error: reqErr } = await supabase
        .from('purchase_requests_2025_11_27_07_17')
        .update({
          department_name: formData.department_name,
          lab_name: formData.lab_name,
          professor_name: formData.professor_name,
          title: formData.title,
          purpose: formData.purpose,
          delivery_name: formData.delivery_name,
          delivery_phone: formData.delivery_phone,
          delivery_address: formData.delivery_address,
          total_amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (reqErr) return { error: reqErr };

      // 기존 품목 삭제 후 재삽입
      await supabase.from('purchase_request_items_2025_11_27_07_17').delete().eq('request_id', requestId);
      if (formData.items?.length > 0) {
        const items = formData.items.map((item, i) => ({
          request_id: requestId,
          item_name: item.item_name,
          specification: item.specification || null,
          quantity: item.quantity,
          unit: item.unit || '개',
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          supplier_url: item.supplier_url || null,
          sort_order: i
        }));
        await supabase.from('purchase_request_items_2025_11_27_07_17').insert(items);
      }

      return { data: true };
    } catch (err) {
      return { error: err };
    }
  };

  const submitRequest = async (requestId, actorId, actorName) => {
    const { error } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
    if (!error) await addHistory(requestId, actorId, actorName, '신청 제출', 'draft', 'submitted');
    return { error };
  };

  const cancelRequest = async (requestId, actorId, actorName) => {
    const { error } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (!error) await addHistory(requestId, actorId, actorName, '신청 취소', null, 'cancelled');
    return { error };
  };

  // ─── 관리자 처리 ───────────────────────────────────────────────────────────

  const startReview = async (requestId, adminId, adminName) => {
    const { error } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .update({ status: 'reviewing', reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (!error) await addHistory(requestId, adminId, adminName, '검토 시작', 'submitted', 'reviewing');
    return { error };
  };

  const approveRequest = async (requestId, adminId, adminName, approvedAmount, memo) => {
    const { error } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .update({
        status: 'approved',
        approved_amount: approvedAmount,
        admin_memo: memo || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
    if (!error) await addHistory(requestId, adminId, adminName, `승인 (승인금액: ${formatMoney(approvedAmount)}원)`, 'reviewing', 'approved', null, { approvedAmount });
    return { error };
  };

  const rejectRequest = async (requestId, adminId, adminName, reason) => {
    const { error } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
    if (!error) await addHistory(requestId, adminId, adminName, '반려', 'reviewing', 'rejected', reason);
    return { error };
  };

  const requestRevision = async (requestId, adminId, adminName, reason) => {
    const { error } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .update({
        status: 'needs_revision',
        revision_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
    if (!error) await addHistory(requestId, adminId, adminName, '보완 요청', 'reviewing', 'needs_revision', reason);
    return { error };
  };

  const resubmitRequest = async (requestId, actorId, actorName) => {
    const { error } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .update({ status: 'submitted', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (!error) await addHistory(requestId, actorId, actorName, '보완 후 재제출', 'needs_revision', 'submitted');
    return { error };
  };

  // ─── 구매 실행 ────────────────────────────────────────────────────────────

  const registerPurchaseOrder = async (requestId, adminId, adminName, orderData) => {
    try {
      const { data: order, error: orderErr } = await supabase
        .from('purchase_orders_2025_11_27_07_17')
        .insert({
          request_id: requestId,
          supplier: orderData.supplier || null,
          order_no: orderData.order_no || null,
          purchased_at: orderData.purchased_at || null,
          shipping_fee: orderData.shipping_fee || 0,
          amount: orderData.amount,
          memo: orderData.memo || null,
          admin_id: adminId
        })
        .select()
        .single();

      if (orderErr) return { error: orderErr };

      // 신청서 상태 → 'purchasing'
      await supabase
        .from('purchase_requests_2025_11_27_07_17')
        .update({ status: 'purchasing', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      await addHistory(requestId, adminId, adminName, `구매 등록 (금액: ${formatMoney(orderData.amount)}원)`, 'approved', 'purchasing', null, { orderId: order.id });
      return { data: order };
    } catch (err) {
      return { error: err };
    }
  };

  const closePurchaseOrder = async (orderId, requestId, adminId, adminName, purchasedAmount) => {
    try {
      await supabase
        .from('purchase_orders_2025_11_27_07_17')
        .update({ is_closed: true, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      // 실제 구매액 업데이트 및 상태 → 'awaiting_receipt'
      await supabase
        .from('purchase_requests_2025_11_27_07_17')
        .update({
          purchased_amount: purchasedAmount,
          status: 'awaiting_receipt',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      await addHistory(requestId, adminId, adminName, `구매 완료 (${formatMoney(purchasedAmount)}원)`, 'purchasing', 'awaiting_receipt');
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  const closeRequest = async (requestId, adminId, adminName) => {
    const { error } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
    if (!error) await addHistory(requestId, adminId, adminName, '처리 완료(종결)', 'receipt_review', 'closed');
    return { error };
  };

  // ─── 수령 보고 ────────────────────────────────────────────────────────────

  const submitReceipt = async (requestId, orderId, reporterId, reporterName, receiptData) => {
    try {
      const { data: receipt, error: recErr } = await supabase
        .from('purchase_receipts_2025_11_27_07_17')
        .insert({
          order_id: orderId,
          request_id: requestId,
          reporter_id: reporterId,
          received_at: receiptData.received_at || null,
          notes: receiptData.notes || null
        })
        .select()
        .single();

      if (recErr) return { error: recErr };

      // 상태 → 'receipt_review'
      await supabase
        .from('purchase_requests_2025_11_27_07_17')
        .update({ status: 'receipt_review', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      await addHistory(requestId, reporterId, reporterName, '수령 보고 제출', 'awaiting_receipt', 'receipt_review');
      return { data: receipt };
    } catch (err) {
      return { error: err };
    }
  };

  const confirmReceipt = async (receiptId, requestId, reviewerId, reviewerName) => {
    await supabase
      .from('purchase_receipts_2025_11_27_07_17')
      .update({ review_status: 'confirmed', reviewer_id: reviewerId, reviewed_at: new Date().toISOString() })
      .eq('id', receiptId);
    return await closeRequest(requestId, reviewerId, reviewerName);
  };

  // 수령 반려 → 신청자가 다시 수령 보고 가능한 'purchasing' 상태로 복귀
  const rejectReceipt = async (receiptId, requestId, reviewerId, reviewerName, reason) => {
    await supabase
      .from('purchase_receipts_2025_11_27_07_17')
      .update({ review_status: 'needs_revision', reviewer_id: reviewerId, reviewed_at: new Date().toISOString() })
      .eq('id', receiptId);
    const { error } = await supabase
      .from('purchase_requests_2025_11_27_07_17')
      .update({ status: 'purchasing', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    if (!error) await addHistory(requestId, reviewerId, reviewerName, `수령 반려 (재수령 요청)`, 'receipt_review', 'purchasing', reason);
    return { error };
  };

  // ─── 첨부파일 ────────────────────────────────────────────────────────────

  const uploadAttachment = async (file, requestId, uploaderId, attachmentType, orderId = null, receiptId = null) => {
    try {
      const ext = file.name.split('.').pop();
      const path = `${requestId}/${attachmentType}_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('purchase-files')
        .upload(path, file);

      if (uploadErr) return { error: uploadErr };

      const { data: att, error: dbErr } = await supabase
        .from('purchase_attachments_2025_11_27_07_17')
        .insert({
          request_id: requestId,
          order_id: orderId,
          receipt_id: receiptId,
          attachment_type: attachmentType,
          file_name: file.name,
          file_size: file.size,
          storage_path: path,
          mime_type: file.type,
          uploader_id: uploaderId
        })
        .select()
        .single();

      if (dbErr) return { error: dbErr };
      return { data: att };
    } catch (err) {
      return { error: err };
    }
  };

  const getAttachmentUrl = async (storagePath) => {
    const { data } = await supabase.storage
      .from('purchase-files')
      .createSignedUrl(storagePath, 3600);
    return data?.signedUrl || null;
  };

  // ─── 이력 ─────────────────────────────────────────────────────────────────

  const addHistory = async (requestId, actorId, actorName, action, beforeStatus, afterStatus, reason = null, extraData = null) => {
    await supabase.from('purchase_history_2025_11_27_07_17').insert({
      request_id: requestId,
      actor_id: actorId,
      actor_name: actorName,
      action,
      before_status: beforeStatus,
      after_status: afterStatus,
      reason,
      extra_data: extraData
    });
  };

  const formatMoney = (n) => (n || 0).toLocaleString('ko-KR');

  const value = {
    purchaseSettings,
    purchaseRequests,
    loading,
    setPurchaseRequests,
    loadPurchaseSettings,
    savePurchaseSetting,
    deletePurchaseSetting,
    getBudgetStatus,
    loadMyRequests,
    loadAllRequests,
    getRequestDetail,
    saveDraft,
    updateDraft,
    submitRequest,
    cancelRequest,
    startReview,
    approveRequest,
    rejectRequest,
    requestRevision,
    resubmitRequest,
    registerPurchaseOrder,
    closePurchaseOrder,
    closeRequest,
    submitReceipt,
    confirmReceipt,
    rejectReceipt,
    uploadAttachment,
    getAttachmentUrl,
    formatMoney
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchaseContext() {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error('usePurchaseContext must be used within PurchaseProvider');
  return ctx;
}

export default PurchaseContext;
