import debounce from 'lodash/debounce';
import { useState, useEffect, useCallback, useReducer } from 'react';
import { ObjectInspector } from 'react-inspector';
import { DropZone } from 'react-science/ui';

import NMRium from '../../component/NMRium';

import { loadData } from './View';

/**
 *
 * @param {Array<File>} acceptedFiles
 * @param {object} options
 * @param {boolean} options.asBuffer
 * @returns
 */
function loadFiles<T = unknown>(
  acceptedFiles,
  options: { asBuffer?: boolean } = {},
) {
  return Promise.all(
    ([] as Array<T>).map.call(acceptedFiles, (file: any) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('abort', (e) => reject(e));
        reader.addEventListener('error', (e) => reject(e));
        reader.addEventListener('load', () => {
          if (reader.result) {
            const binary = reader.result;
            const name = getFileName(file.name);
            const extension = getFileExtension(file.name);
            resolve({ binary, name, extension });
          }
        });
        if (options.asBuffer) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsBinaryString(file);
        }
      });
    }),
  ) as Promise<Array<T>>;
}

function getFileExtension(name) {
  return name.replace(/^.*\./, '').toLowerCase();
}

function getFileName(name) {
  return name.slice(0, Math.max(0, name.lastIndexOf('.')));
}

function searchDeep(obj, searchKey) {
  let result: any = [];
  function objectHelper(obj) {
    for (const key in obj) {
      if (searchKey === key) {
        result.push({ [key]: obj[key] });
      }
      if (Array.isArray(obj[key])) {
        for (const object of obj[key]) {
          objectHelper(object);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        objectHelper(obj[key]);
      }
    }
  }

  objectHelper(obj);
  return result;
}

function Inspector(data: any) {
  const [filteredData, seData] = useState<any>();
  const [key, setKey] = useState<string>('');
  useEffect(() => {
    const result = searchDeep(data, key);
    seData(key ? result : data);
  }, [data, key]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(
    debounce((e) => {
      const key = e.target.value;
      setKey(key);
    }, 500),
    [data],
  );

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', paddingTop: '10px' }}
    >
      <input
        style={{ border: '1px solid gray', padding: '5px' }}
        type="text"
        placeholder="Search for key..."
        onChange={handleSearch}
      />
      <ObjectInspector data={filteredData} />;
    </div>
  );
}

export default function Test(props) {
  const { file, title, baseURL, workspace } = props;
  const [data, setData] = useState<any>();
  const [viewCount, incrementViewCount] = useReducer((a) => a + 1, 0);
  const [dataCount, incrementDataCount] = useReducer((a) => a + 1, 0);
  useEffect(() => {
    if (file) {
      void loadData(file).then((d) => {
        const _d = JSON.parse(JSON.stringify(d).replace(/\.\/+?/g, baseURL));
        setData(_d);
      });
    } else {
      setData(undefined);
    }
  }, [baseURL, file, props]);
  const [viewCallBack, setViewCallBack] = useState<any>({});
  const [dataCallBack, setDataCallBack] = useState<any>({});
  const dropFileHandler = useCallback((dropFiles) => {
    void (async () => {
      try {
        const files = await loadFiles<{ binary: any }>(dropFiles, {
          asBuffer: true,
        });

        const decoder = new TextDecoder('utf8');
        const data = JSON.parse(decoder.decode(files[0].binary));
        setData(data);
      } catch (error) {
        reportError(error);
        // eslint-disable-next-line no-alert
        alert('Invalid JSON file');
      }
    })();
  }, []);
  const viewChangeHandler = (data) => {
    incrementViewCount();
    setViewCallBack({ activate: true, data });
    setTimeout(() => {
      setViewCallBack(({ data }) => ({ data, activate: false }));
    }, 500);
  };
  const dataChangeHandler = useCallback((data) => {
    incrementDataCount();
    setDataCallBack({ activate: true, data });
    setTimeout(() => {
      setDataCallBack(({ data }) => ({ data, activate: false }));
    }, 500);
  }, []);

  return (
    <div
      style={{
        height: '100%',
        marginLeft: 30,
      }}
    >
      {file && (
        <div
          style={{
            height: '60px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <h5
            style={{
              fontWeight: 700,
              fontSize: '1.5em',
              lineHeight: '1.4em',
              marginBottom: '15px',
            }}
          >
            Display and process 1D NMR spectra from a JCAMP-DX file
          </h5>
          <p
            style={{
              marginTop: '-10px',
              marginBottom: '1rem',
              fontWeight: 400,
              color: '#9a9a9a',
              fontSize: '0.7142em',
            }}
          >
            {title}
          </p>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          minHeight: file ? '90vh' : '100vh',
          padding: file ? '' : '20px 0',
        }}
      >
        <div style={{ flex: 9 }}>
          <NMRium
            data={data}
            onViewChange={viewChangeHandler}
            onDataChange={dataChangeHandler}
            workspace={workspace || null}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '10px',
            flex: 3,
          }}
        >
          <div style={{ flex: 3 }}>
            <DropZone onDrop={dropFileHandler} color="gray" />
          </div>
          <div style={{ flex: 9 }}>
            <h3
              style={
                dataCallBack.activate
                  ? { color: 'red', fontWeight: 'bold' }
                  : {}
              }
            >
              <span data-test-id="data-count">{dataCount}</span> - Data Change:
            </h3>
            <Inspector data={dataCallBack.data} />
            <h3
              style={
                viewCallBack.activate
                  ? { color: 'red', fontWeight: 'bold' }
                  : {}
              }
            >
              <span data-test-id="view-count">{viewCount}</span> - View Change:
            </h3>
            <Inspector data={viewCallBack.data} />
          </div>
        </div>
      </div>
    </div>
  );
}
