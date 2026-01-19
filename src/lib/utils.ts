import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  return `${day}/${month}`;
}

export function getMonthName(dateString: string): string {
  const date = new Date(dateString);
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return monthNames[date.getMonth()];
}

export const getBankDetails = (bankName: string) => {
  const name = bankName.toLowerCase();
  const defaultDetails = { color: "#1e293b", logo: "https://logo.clearbit.com/bank.com" };

  if (name.includes("nubank") || name.includes("nu pagamentos")) return { color: "#820ad1", logo: "https://cdn.worldvectorlogo.com/logos/nubank-3.svg" }; // Roxo Nubank
  if (name.includes("itaú") || name.includes("itau")) return { color: "#ec7000", logo: "https://logo.clearbit.com/itau.com.br" }; // Laranja Itaú
  if (name.includes("bradesco")) return { color: "#cc092f", logo: "https://logo.clearbit.com/bradesco.com.br" }; // Vermelho Bradesco
  if (name.includes("santander")) return { color: "#ec2028", logo: "https://logo.clearbit.com/santander.com.br" }; // Vermelho Santander
  if (name.includes("inter")) return { color: "#ff7a00", logo: "https://logo.clearbit.com/bancointer.com.br" }; // Laranja Inter
  if (name.includes("brasil") || name.includes("bb")) return { color: "#0038a8", logo: "https://logo.clearbit.com/bb.com.br" }; // Azul BB
  if (name.includes("caixa")) return { color: "#0066b3", logo: "https://logo.clearbit.com/caixa.gov.br" }; // Azul Caixa
  if (name.includes("btg")) return { color: "#000000", logo: "https://logo.clearbit.com/btgpactual.com" }; // Preto BTG
  if (name.includes("xp")) return { color: "#000000", logo: "https://logo.clearbit.com/xpi.com.br" }; // Preto XP
  if (name.includes("c6")) return { color: "#000000", logo: "https://logo.clearbit.com/c6bank.com.br" }; // Preto C6

  return defaultDetails;
};
