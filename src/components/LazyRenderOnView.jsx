import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

function LazyRenderOnView({ children, placeholderHeight = 320, rootMargin = '200px 0px', className = '' }) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? (
        children
      ) : (
        <div className="deferred-placeholder" style={{ minHeight: placeholderHeight }} aria-hidden="true" />
      )}
    </div>
  );
}

LazyRenderOnView.propTypes = {
  children: PropTypes.node.isRequired,
  placeholderHeight: PropTypes.number,
  rootMargin: PropTypes.string,
  className: PropTypes.string,
};

export default LazyRenderOnView;
