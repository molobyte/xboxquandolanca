import brFlag from '../assets/flags/br.svg';
import nzFlag from '../assets/flags/nz.svg';
import jpFlag from '../assets/flags/jp.svg';
import gbFlag from '../assets/flags/gb.svg';
import usFlag from '../assets/flags/us.svg';

const FLAGS = {
  BR: { src: brFlag, label: 'Brasil' },
  NZ: { src: nzFlag, label: 'Nova Zelândia' },
  JP: { src: jpFlag, label: 'Japão' },
  GB: { src: gbFlag, label: 'Reino Unido' },
  US: { src: usFlag, label: 'Estados Unidos' },
};

export default function CountryFlag({ code, className = 'w-4 h-3' }) {
  const item = FLAGS[code?.toUpperCase()];
  if (!item) return null;

  return (
    <img
      src={item.src}
      alt={`Bandeira de ${item.label}`}
      className={`inline-block shrink-0 rounded-[2px] object-cover shadow-sm ring-1 ring-white/20 ${className}`}
      loading="lazy"
    />
  );
}
