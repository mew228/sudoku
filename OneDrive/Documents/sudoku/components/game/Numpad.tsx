import { useGameStore } from "@/lib/store";
import { motion } from "framer-motion";

export const Numpad = () => {
    const setCellValue = useGameStore(state => state.setCellValue);
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const handleDragStart = (e: React.DragEvent, num: number) => {
        e.dataTransfer.setData('text/plain', num.toString());
        e.dataTransfer.effectAllowed = 'copy';

        // Optional: Create a custom drag image if needed, but default is usually fine
        // const img = new Image();
        // img.src = ...
        // e.dataTransfer.setDragImage(img, 0, 0);
    };

    return (
        <div className="grid grid-cols-3 gap-2 w-full">
            {numbers.map((num) => (
                <motion.div
                    key={num}
                    draggable
                    onDragStart={(e) => handleDragStart(e as any, num)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.90 }}
                    onClick={() => setCellValue(num)} // Keep click for accessibility/speed
                    className="aspect-[4/3] flex items-center justify-center text-4xl font-light text-indigo-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700 active:bg-indigo-100 rounded-xl transition-all duration-75 cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'none' }} // Hint for touch devices, though HTML5 DnD is desktop focused usually.
                >
                    {num}
                </motion.div>
            ))}
        </div>
    );
};
