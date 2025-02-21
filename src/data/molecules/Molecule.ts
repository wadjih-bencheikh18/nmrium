import { v4 } from '@lukeed/uuid';
import { Molecule as OCLMolecule } from 'openchemlib/full';

import { Position } from '../../component/elements/draggable/useDraggable';
import getAtomsFromMF from '../utilities/getAtomsFromMF';

export interface StateMolecule {
  id: string;
  molfile: string;
  label: string;
}
export interface StateMoleculeExtended extends StateMolecule {
  mf: string;
  em: number;
  mw: number;
  svg: string;
  atoms: Record<string, number>;
}

export type MoleculesView = Record<string, MoleculeView>;
export interface MoleculeView {
  floating: {
    /**
     * If the floating molecule is shown.
     */
    visible: boolean;
    /**
     * Floating molecule position.
     */
    position: Position;
  };
  /**
   * Show/Hide atoms numbers on the molecule.
   */
  showAtomNumber: boolean;
}
export function initMolecule(
  options: Partial<StateMolecule> = {},
): StateMoleculeExtended {
  const id = options.id || v4();
  const label = options.label || 'p#';
  const molfile = options.molfile || '';

  const mol = OCLMolecule.fromMolfile(molfile);
  const mfInfo = mol.getMolecularFormula();

  return {
    id,
    molfile,
    label,
    mf: mfInfo.formula,
    em: mfInfo.absoluteWeight,
    mw: mfInfo.relativeWeight,
    svg: mol.toSVG(50, 50),
    atoms: getAtomsFromMF(mfInfo.formula),
  };
}

export function toJSON(molecule: StateMoleculeExtended): StateMolecule {
  const { molfile, label, id } = molecule;
  return {
    molfile,
    label,
    id,
  };
}
