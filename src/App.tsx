/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Customer, AgencySettings, MonthBill, PaymentRecord, LedgerTransaction } from './types';
import {
  getStoredCustomers,
  saveCustomers,
  getStoredPayments,
  savePayments,
  getStoredTransactions,
  saveTransactions,
  getStoredSettings,
  saveSettings,
  getActiveMonth,
  saveActiveMonth,
  clearAllCustomerData,
} from './utils/storage';
import { calculateCustomerBill } from './utils/billingUtils';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { CustomerList } from './components/CustomerList';
import { CustomerModal } from './components/CustomerModal';
import { BillModal } from './components/BillModal';
import { PaymentModal } from './components/PaymentModal';
import { TransactionModal } from './components/TransactionModal';
import { CustomerLedgerModal } from './components/CustomerLedgerModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { BatchBillingModal } from './components/BatchBillingModal';
import { RemindersView } from './components/RemindersView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  // State
  const [customers, setCustomers] = useState<Customer[]>(() => getStoredCustomers());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => getStoredPayments());
  const [settings, setSettings] = useState<AgencySettings>(() => getStoredSettings());
  const [activeMonth, setActiveMonth] = useState<string>(() => getActiveMonth());
  const [activeTab, setActiveTab] = useState<'customers' | 'reminders' | 'reports'>('customers');

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<MonthBill | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentBill, setPaymentBill] = useState<MonthBill | null>(null);

  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Transactions (रकम जमा & नया उधार) & Passbook state
  const [transactions, setTransactions] = useState<LedgerTransaction[]>(() => getStoredTransactions());
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionCustomerId, setTransactionCustomerId] = useState<string | null>(null);
  const [transactionDefaultType, setTransactionDefaultType] = useState<'jama' | 'udhar'>('jama');

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);
  const [ledgerBill, setLedgerBill] = useState<MonthBill | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    savePayments(payments);
  }, [payments]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveActiveMonth(activeMonth);
  }, [activeMonth]);

  // Derived Routes list
  const existingRoutes = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.route) set.add(c.route.trim());
    });
    return Array.from(set).sort();
  }, [customers]);

  // Derived calculated bills for each customer in active month
  const bills: MonthBill[] = useMemo(() => {
    return customers.map((c, index) =>
      calculateCustomerBill(c, index, activeMonth, settings, payments)
    );
  }, [customers, activeMonth, settings, payments]);

  // Update selectedBill if bills change while BillModal is open
  useEffect(() => {
    if (selectedBill) {
      const updated = bills.find((b) => b.customerId === selectedBill.customerId);
      if (updated) setSelectedBill(updated);
    }
  }, [bills, selectedBill]);

  // Handlers
  const handleSaveCustomer = (savedCustomer: Customer) => {
    setCustomers((prev) => {
      const existsIndex = prev.findIndex((c) => c.id === savedCustomer.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = savedCustomer;
        return copy;
      }
      return [savedCustomer, ...prev];
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  const handleUpdatePauseDays = (customerId: string, days: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, pauseDaysCount: days } : c))
    );
  };

  const handleSavePayment = (payment: PaymentRecord) => {
    setPayments((prev) => [payment, ...prev]);

    // Also reduce customer's stored oldDue if the payment was for past dues
    const customer = customers.find((c) => c.id === payment.customerId);
    if (customer && customer.oldDue > 0) {
      const bill = bills.find((b) => b.customerId === customer.id);
      const currentMonthCharge = (bill?.dailyPaperAmount || 0) + (bill?.deliveryCharge || 0);
      if (payment.amount > currentMonthCharge) {
        const remainingOldDue = Math.max(0, customer.oldDue - (payment.amount - currentMonthCharge));
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, oldDue: remainingOldDue } : c))
        );
      }
    }
  };

  const handleSaveTransaction = (
    tx: LedgerTransaction,
    updatedOldDue: number,
    optionalPayment?: PaymentRecord
  ) => {
    setTransactions((prev) => [tx, ...prev]);

    // Update customer's oldDue immediately
    setCustomers((prev) =>
      prev.map((c) => (c.id === tx.customerId ? { ...c, oldDue: updatedOldDue } : c))
    );

    // If payment record provided for monthly receipts
    if (optionalPayment) {
      setPayments((prev) => [optionalPayment, ...prev]);
    }
  };

  const handleImportCustomers = (imported: Customer[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setCustomers(imported);
    } else {
      setCustomers((prev) => [...imported, ...prev]);
    }
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        'क्या आप सभी ग्राहकों, पेमेंट और लेन-देन का डेटा हटाना चाहते हैं? इसके बाद आप नई एक्सेल शीट अपलोड कर सकेंगे।'
      )
    ) {
      clearAllCustomerData();
      setCustomers([]);
      setPayments([]);
      setTransactions([]);
    }
  };

  const handleReloadData = () => {
    setCustomers(getStoredCustomers());
    setPayments(getStoredPayments());
    setTransactions(getStoredTransactions());
    setSettings(getStoredSettings());
    setActiveMonth(getActiveMonth());
  };

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const openTransactionModal = (customerId?: string, defaultType: 'jama' | 'udhar' = 'jama') => {
    setTransactionCustomerId(customerId || null);
    setTransactionDefaultType(defaultType);
    setIsTransactionModalOpen(true);
  };

  const openLedgerModal = (customer: Customer, bill?: MonthBill) => {
    setLedgerCustomer(customer);
    setLedgerBill(bill || bills.find((b) => b.customerId === customer.id) || null);
    setIsLedgerModalOpen(true);
  };

  const openBillModal = (bill: MonthBill) => {
    setSelectedBill(bill);
    setIsBillModalOpen(true);
  };

  const openPaymentModal = (bill: MonthBill) => {
    setPaymentBill(bill);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans antialiased text-stone-900">
      {/* Header Bar */}
      <Header
        settings={settings}
        activeMonth={activeMonth}
        onMonthChange={setActiveMonth}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewCustomer={openNewCustomerModal}
        onOpenExcelImport={() => setIsExcelImportOpen(true)}
        onOpenBatchPrint={() => setIsBatchPrintOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTransactionModal={(type) => openTransactionModal(undefined, type || 'jama')}
        customerCount={customers.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        {/* Top Summary Stats */}
        <DashboardStats
          bills={bills}
          settings={settings}
          activeMonth={activeMonth}
        />

        {/* Tab Content Views */}
        {activeTab === 'customers' && (
          <CustomerList
            bills={bills}
            customers={customers}
            settings={settings}
            routes={existingRoutes}
            onOpenBill={openBillModal}
            onRecordPayment={openPaymentModal}
            onOpenTransaction={(customerId, type) => openTransactionModal(customerId, type || 'jama')}
            onOpenLedger={openLedgerModal}
            onEditCustomer={openEditCustomerModal}
            onDeleteCustomer={handleDeleteCustomer}
            onUpdatePauseDays={handleUpdatePauseDays}
            onOpenExcelImport={() => setIsExcelImportOpen(true)}
            onOpenNewCustomer={openNewCustomerModal}
            onClearAllData={handleClearAllData}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            bills={bills}
            settings={settings}
            routes={existingRoutes}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportView
            bills={bills}
            payments={payments}
            settings={settings}
            activeMonth={activeMonth}
          />
        )}
      </main>

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        existingRoutes={existingRoutes}
        settings={settings}
        totalCustomersCount={customers.length}
      />

      <BillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        bill={selectedBill}
        settings={settings}
        onRecordPayment={(bill) => {
          setIsBillModalOpen(false);
          openPaymentModal(bill);
        }}
        onOpenTransaction={(customerId, type) => {
          setIsBillModalOpen(false);
          openTransactionModal(customerId, type);
        }}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        bill={paymentBill}
        customers={customers}
        bills={bills}
        onSavePayment={handleSavePayment}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        customers={customers}
        bills={bills}
        settings={settings}
        preSelectedCustomerId={transactionCustomerId}
        defaultType={transactionDefaultType}
        onSaveTransaction={handleSaveTransaction}
      />

      <CustomerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        customer={ledgerCustomer}
        bill={ledgerBill}
        transactions={transactions}
        settings={settings}
        onOpenNewTransaction={(customerId, defType) => {
          openTransactionModal(customerId, defType);
        }}
      />

      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onImportCustomers={handleImportCustomers}
        currentCustomersCount={customers.length}
      />

      <BatchBillingModal
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
        bills={bills}
        settings={settings}
        routes={existingRoutes}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onReloadData={handleReloadData}
      />
    </div>
  );
}
