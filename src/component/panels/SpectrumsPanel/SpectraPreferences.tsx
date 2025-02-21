import { Formik } from 'formik';
import { useImperativeHandle, useRef, memo, forwardRef } from 'react';

import { usePreferences } from '../../context/PreferencesContext';
import useNucleus from '../../hooks/useNucleus';
import { usePanelPreferencesByNuclei } from '../../hooks/usePanelPreferences';
import { PanelsPreferences } from '../../workspaces/Workspace';
import { NucleusGroup } from '../extra/preferences/NucleusGroup';
import { PreferencesContainer } from '../extra/preferences/PreferencesContainer';

import { SpectraColumnsManager } from './base/SpectraColumnsManager';

function SpectraPreferences(props, ref: any) {
  const formRef = useRef<any>(null);
  const preferences = usePreferences();
  const nuclei = useNucleus();
  const preferencesByNuclei = usePanelPreferencesByNuclei('spectra', nuclei);

  function saveHandler(values) {
    preferences.dispatch({
      type: 'SET_PANELS_PREFERENCES',
      payload: { key: 'spectra', value: values },
    });
  }

  useImperativeHandle(
    ref,
    () => ({
      saveSetting: () => {
        formRef.current.submitForm();
      },
    }),
    [],
  );

  function handleAdd(nucleus, index) {
    const data: PanelsPreferences['spectra'] = formRef.current.values;
    let columns = data.nuclei[nucleus].columns;

    columns = [
      ...columns.slice(0, index),
      {
        jpath: '',
        label: '',
        visible: true,
      },
      ...columns.slice(index),
    ];

    formRef.current.setValues({
      ...data,
      nuclei: {
        ...data.nuclei,
        [nucleus]: {
          ...data[nucleus],
          columns,
        },
      },
    });
  }

  function handleDelete(nucleus, index) {
    const data: PanelsPreferences['spectra'] = formRef.current.values;
    const columns = data.nuclei[nucleus].columns.filter(
      (_, columnIndex) => columnIndex !== index,
    );
    formRef.current.setValues({
      ...data,
      nuclei: {
        ...data.nuclei,
        [nucleus]: {
          ...data[nucleus],
          columns,
        },
      },
    });
  }

  return (
    <PreferencesContainer>
      <Formik
        innerRef={formRef}
        onSubmit={saveHandler}
        initialValues={preferencesByNuclei}
      >
        <>
          {nuclei?.map((n) => (
            <NucleusGroup key={n} nucleus={n}>
              <SpectraColumnsManager
                nucleus={n}
                onAdd={handleAdd}
                onDelete={handleDelete}
              />
            </NucleusGroup>
          ))}
        </>
      </Formik>
    </PreferencesContainer>
  );
}

export default memo(forwardRef(SpectraPreferences));
