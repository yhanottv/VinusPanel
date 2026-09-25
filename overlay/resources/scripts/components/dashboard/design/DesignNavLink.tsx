import React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';
import { navigationCatalog } from './navigationCatalog';
import { useDesign } from '@/designRuntime';
export default function DesignNavLink({children,...props}:NavLinkProps) {
 const design=useDesign();
 const path=typeof props.to === 'string' ? props.to.replace(/^\/server\/[^/]+/,'/server/:id') : '';
 const rule=design.navigation.find(item=>item.path===path);
 if(rule && !rule.visible) return null;
 return <NavLink {...props} title={rule?.label || props.title} style={{...props.style,order:rule?.order ?? navigationCatalog.find(item=>item.path===path)?.order}}>{React.Children.map(children,child=>React.isValidElement(child)&&child.type==='span'&&rule?.label ? React.cloneElement(child,{},rule.label) : child)}</NavLink>;
}
