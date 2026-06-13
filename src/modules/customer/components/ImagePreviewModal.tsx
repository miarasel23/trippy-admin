
export interface ImagePreviewModalProps {
  previewImage: { url: string; title: string } | null;
  onClose: () => void;
}

export default function ImagePreviewModal({ previewImage, onClose }: ImagePreviewModalProps) {
  if (!previewImage) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
            <h3 className="text-white font-semibold">{previewImage.title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 flex justify-center bg-slate-950">
            <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-96 object-contain" />
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
    </>
  );
}
