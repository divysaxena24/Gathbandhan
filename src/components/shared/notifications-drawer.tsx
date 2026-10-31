"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck2,
  CreditCard,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NotificationItem {
  id: string;
  channel: "IN_APP" | "EMAIL" | "WHATSAPP" | "SMS";
  template: string;
  title: string;
  body: string;
  status: string;
  providerReference: string | null;
  isSimulator: boolean;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        const items = json.data || [];
        setNotifications(items);
        setUnreadCount(items.filter((n: NotificationItem) => !n.readAt).length);
      }
    } catch {
      // Ignore background fetch failure
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore error
    }
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // Ignore error
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplateIcon = (template: string) => {
    switch (template) {
      case "AGREEMENT_SIGNED":
        return <FileCheck2 className="w-4 h-4 text-emerald-600" />;
      case "CLIENT_PAYMENT_DUE":
      case "VENDOR_PAYMENT_DUE":
        return <CreditCard className="w-4 h-4 text-gold-600" />;
      case "VENDOR_LATE":
      case "INCIDENT_ALERT":
        return <AlertTriangle className="w-4 h-4 text-ruby-600" />;
      case "TASK_DEADLINE":
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-charcoal-500" />;
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "WHATSAPP":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
            <MessageSquare className="w-2.5 h-2.5 mr-1 inline" />
            WhatsApp
          </Badge>
        );
      case "SMS":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
            SMS
          </Badge>
        );
      default:
        return (
          <Badge className="bg-sand-100 text-charcoal-700 border-sand-200 text-[10px]">
            In-App
          </Badge>
        );
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-charcoal-600 hover:text-charcoal-900 hover:bg-sand-100 rounded-lg transition-colors"
        title="Agency Notifications & Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ruby-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-sand-200 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-serif font-bold text-charcoal-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-gold-600" />
                Agency Notifications
              </DialogTitle>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Multi-channel operational & financial alerts
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-xs text-gold-700 hover:text-gold-800 hover:bg-gold-50 h-7 px-2"
              >
                Mark all read
              </Button>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 text-sand-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-charcoal-700">All caught up!</p>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  No active operational alerts or payment notices at this time.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      isUnread
                        ? "bg-gold-50/40 border-gold-300 shadow-sm"
                        : "bg-white border-sand-200"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-md bg-sand-100 flex-shrink-0 mt-0.5">
                        {getTemplateIcon(n.template)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className="font-semibold text-charcoal-900 truncate">
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-charcoal-400 flex-shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-charcoal-600 text-xs leading-relaxed mb-2">
                          {n.body}
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-sand-100 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            {getChannelBadge(n.channel)}
                            {n.isSimulator && (
                              <Badge
                                variant="outline"
                                className="text-[9px] text-charcoal-400 border-sand-300 px-1 py-0"
                              >
                                Simulator
                              </Badge>
                            )}
                          </div>
                          {isUnread && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              className="text-gold-700 hover:text-gold-900 font-medium flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
