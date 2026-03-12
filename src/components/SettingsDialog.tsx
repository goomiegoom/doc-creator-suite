import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppSettings } from "@/types/voucher";
import { Settings, RefreshCw, ExternalLink } from "lucide-react";
import { gdriveToDirectUrl } from "@/lib/google-utils";

interface Props {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onFetchPayees: () => void;
  isFetching: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ settings, onChange, onFetchPayees, isFetching, open, onOpenChange }: Props) {
  const logoPreview = gdriveToDirectUrl(settings.logoGdriveUrl);
  const sigPreview = gdriveToDirectUrl(settings.signatureGdriveUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>⚙️ ตั้งค่าระบบ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Google Sheet */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">📊 Google Sheet ฐานข้อมูลผู้รับเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-xs">URL ของ Google Sheet (Publish to web หรือ share link)</Label>
                <Input
                  value={settings.googleSheetUrl}
                  onChange={(e) => onChange({ ...settings, googleSheetUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="h-9 text-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ ต้อง Publish Sheet ก่อน: File → Share → Publish to web → เลือก sheet "ฐานข้อมูลผู้ขาย" → Publish
              </p>
              <Button size="sm" onClick={onFetchPayees} disabled={!settings.googleSheetUrl || isFetching} className="h-8 text-xs">
                <RefreshCw className={`mr-1 h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
                {isFetching ? "กำลังดึงข้อมูล..." : "ดึงข้อมูลผู้รับเงิน"}
              </Button>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">🏢 Logo บริษัท</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-xs">Google Drive sharing link ของ Logo</Label>
                <Input
                  value={settings.logoGdriveUrl}
                  onChange={(e) => onChange({ ...settings, logoGdriveUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="h-9 text-xs"
                />
              </div>
              {logoPreview && (
                <div className="border border-border rounded p-2 bg-muted/50">
                  <img src={logoPreview} alt="Logo preview" className="max-h-16 mx-auto" referrerPolicy="no-referrer" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">✍️ ลายเซ็นผู้จ่ายเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-xs">Google Drive sharing link ของลายเซ็น</Label>
                <Input
                  value={settings.signatureGdriveUrl}
                  onChange={(e) => onChange({ ...settings, signatureGdriveUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="h-9 text-xs"
                />
              </div>
              {sigPreview && (
                <div className="border border-border rounded p-2 bg-muted/50">
                  <img src={sigPreview} alt="Signature preview" className="max-h-16 mx-auto" referrerPolicy="no-referrer" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
