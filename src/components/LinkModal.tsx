import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface LinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (url: string) => void;
}

export const LinkModal = ({ isOpen, onClose, onConfirm }: LinkModalProps) => {
    const [url, setUrl] = useState('');

    const handleConfirm = () => {
        if (url) {
            onConfirm(url);
            setUrl('');
            onClose();
        }
    };

    const handleClose = () => {
        setUrl('');
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleConfirm();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Insert Link</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input
                        type="url"
                        placeholder="Enter URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleConfirm}>Insert</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LinkModal; 