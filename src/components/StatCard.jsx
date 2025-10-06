import React from "react";
import { motion } from "framer-motion";

const StatCard = ({ title, value, sub }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white shadow-sm border p-5">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
    {sub && <div className="mt-2 text-xs text-gray-400">{sub}</div>}
  </motion.div>
);

export default StatCard;