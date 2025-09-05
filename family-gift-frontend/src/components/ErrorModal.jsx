import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const ErrorModal = ({ isOpen, onClose, message = '网络错误，请重试' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-96 mx-4 shadow-2xl border-0 bg-gradient-to-br from-red-600/20 via-pink-600/15 to-rose-700/20 border border-red-400/40">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-red-400/30">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-xl font-bold text-white">操作失败</CardTitle>
          <p className="text-red-200">{message}</p>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <X className="w-4 h-4 mr-2" />
            确定
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorModal;